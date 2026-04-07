/**
 * Emoji Guess — Kitty Party Edition
 * Node.js + Express + Socket.IO Server
 * Features: multiple choice, rejoin support
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const puzzles = require('./puzzles');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};
const playerRooms = {};  // socketId -> roomCode

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function uniqueRoomCode() {
  let code;
  do { code = generateRoomCode(); } while (rooms[code]);
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function points(rank) {
  return { 1: 10, 2: 7, 3: 5 }[rank] || 2;
}

function playerNames(room) {
  return room.players.map(p => p.name);
}

function leaderboard(room) {
  return room.players
    .map(p => ({ name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

/** Shuffle the 4 options so correct answer isn't always first */
function shuffledOptions(puzzle) {
  return shuffle([...puzzle.options]);
}

io.on('connection', (socket) => {
  log(`Connected: ${socket.id}`);

  // ── Create Room ──────────────────────────────────────────────────────────
  socket.on('create-room', (data) => {
    const roomCode = uniqueRoomCode();
    const hostName = data?.playerName || data?.name || 'Host';
    const totalRounds = Math.min(Math.max(data?.totalRounds || 10, 1), 50);

    rooms[roomCode] = {
      host: socket.id,
      hostName,
      players: [{ id: socket.id, name: hostName, score: 0, online: true }],
      currentRound: 0,
      totalRounds,
      puzzles: [],
      roundScorers: 0,
      roundActive: false,
      guessedThisRound: new Set(),
      currentPuzzle: null
    };

    playerRooms[socket.id] = roomCode;
    socket.join(roomCode);
    log(`Room ${roomCode} created by ${hostName}`);
    socket.emit('room-created', { roomCode, totalRounds });
  });

  // ── Join Room (or Rejoin) ─────────────────────────────────────────────────
  socket.on('join-room', (data, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const roomCode = data?.roomCode?.toUpperCase();
    const name = data?.playerName || data?.name;

    if (!roomCode || !name) return cb({ error: 'Room code and name are required' });

    const room = rooms[roomCode];
    if (!room) return cb({ error: 'Room not found. Check the code and try again.' });

    // Check if this is a REJOIN (same name already in room)
    const existing = room.players.find(p => p.name === name);
    if (existing) {
      // Rejoin: update socket id, mark online
      existing.id = socket.id;
      existing.online = true;
      playerRooms[socket.id] = roomCode;
      socket.join(roomCode);

      // If this rejoining player is the host, update host socket id
      if (existing.name === room.hostName) {
        room.host = socket.id;
      }

      log(`${name} REJOINED room ${roomCode} (score: ${existing.score})`);

      cb({
        success: true,
        rejoin: true,
        totalRounds: room.totalRounds,
        players: playerNames(room),
        currentScore: existing.score
      });

      // If game is active, send the current round state immediately
      if (room.roundActive && room.currentPuzzle) {
        socket.emit('round-start', {
          roundNumber: room.currentRound + 1,
          totalRounds: room.totalRounds,
          emoji: room.currentPuzzle.emojis,
          category: 'Telugu Movie',
          hint: room.currentPuzzle.hint,
          options: shuffledOptions(room.currentPuzzle),
          alreadyGuessed: room.guessedThisRound.has(socket.id)
        });
      }

      io.to(roomCode).emit('player-joined', {
        players: playerNames(room),
        onlinePlayers: room.players.filter(p => p.online).length
      });

      return;
    }

    // New player joining
    if (room.roundActive) return cb({ error: 'Game already in progress. Wait for the next game.' });

    room.players.push({ id: socket.id, name, score: 0, online: true });
    playerRooms[socket.id] = roomCode;
    socket.join(roomCode);
    log(`${name} joined room ${roomCode}`);

    cb({ success: true, totalRounds: room.totalRounds, players: playerNames(room), currentScore: 0 });

    io.to(roomCode).emit('player-joined', {
      players: playerNames(room),
      onlinePlayers: room.players.filter(p => p.online).length
    });
  });

  // ── Start Game ───────────────────────────────────────────────────────────
  socket.on('start-game', (data) => {
    const roomCode = data?.roomCode || playerRooms[socket.id];
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id) return;
    if (room.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    room.puzzles = shuffle(puzzles).slice(0, room.totalRounds);
    room.currentRound = 0;
    room.roundScorers = 0;
    room.guessedThisRound = new Set();
    room.roundActive = true;
    room.currentPuzzle = room.puzzles[0];
    room.players.forEach(p => (p.score = 0));

    log(`Game started in ${roomCode} — ${room.totalRounds} rounds`);
    emitRound(roomCode, room);
  });

  // ── Submit Guess (multiple choice) ───────────────────────────────────────
  socket.on('submit-guess', (data) => {
    const roomCode = data?.roomCode || playerRooms[socket.id];
    const room = rooms[roomCode];
    if (!room || !room.roundActive) return;
    if (room.guessedThisRound.has(socket.id)) return;

    const guess = (data.guess || '').trim().toLowerCase();
    if (!guess) return;

    const isCorrect = room.currentPuzzle.answer.toLowerCase() === guess;

    // Mark as guessed regardless (player used their one attempt)
    room.guessedThisRound.add(socket.id);

    if (isCorrect) {
      room.roundScorers += 1;

      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;

      const pts = points(room.roundScorers);
      player.score += pts;

      log(`${player.name} guessed correctly in ${roomCode} (+${pts})`);

      socket.emit('guess-result', {
        isCorrect: true,
        points: pts,
        position: room.roundScorers,
        totalScore: player.score
      });

      io.to(roomCode).emit('round-update', {
        playerName: player.name,
        position: room.roundScorers,
        scorersCount: room.roundScorers
      });
    } else {
      socket.emit('guess-result', { isCorrect: false });
    }
  });

  // ── Next Round ───────────────────────────────────────────────────────────
  socket.on('next-round', (data) => {
    const roomCode = data?.roomCode || playerRooms[socket.id];
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id) return;

    io.to(roomCode).emit('round-end', {
      roundNumber: room.currentRound + 1,
      answer: room.currentPuzzle.answer,
      leaderboard: leaderboard(room)
    });

    room.currentRound += 1;
    room.roundScorers = 0;
    room.guessedThisRound = new Set();

    if (room.currentRound >= room.totalRounds) {
      room.roundActive = false;
      log(`Game over in ${roomCode}`);
      io.to(roomCode).emit('game-over', { leaderboard: leaderboard(room) });
    } else {
      room.currentPuzzle = room.puzzles[room.currentRound];
      room.roundActive = true;
      log(`Round ${room.currentRound + 1} in ${roomCode}`);
      emitRound(roomCode, room);
    }
  });

  // ── End Game ─────────────────────────────────────────────────────────────
  socket.on('end-game', (data) => {
    const roomCode = data?.roomCode || playerRooms[socket.id];
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id) return;

    room.roundActive = false;
    log(`Game manually ended in ${roomCode}`);
    io.to(roomCode).emit('game-over', { leaderboard: leaderboard(room) });
  });

  // ── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const roomCode = playerRooms[socket.id];
    if (!roomCode || !rooms[roomCode]) { delete playerRooms[socket.id]; return; }

    const room = rooms[roomCode];
    const player = room.players.find(p => p.id === socket.id);
    if (!player) { delete playerRooms[socket.id]; return; }

    // Mark offline but keep in room so they can rejoin
    player.online = false;
    log(`${player.name} disconnected from ${roomCode} (kept for rejoin)`);

    // If host disconnects, notify but keep room alive for 5 minutes
    if (socket.id === room.host) {
      io.to(roomCode).emit('host-disconnected', {
        message: 'Host disconnected. They can rejoin with the same room code.'
      });
      // Give host 5 minutes to rejoin before destroying room
      room.hostTimeout = setTimeout(() => {
        if (rooms[roomCode]) {
          io.to(roomCode).emit('host-disconnected', { message: 'Host did not return — game ended.' });
          delete rooms[roomCode];
        }
      }, 5 * 60 * 1000);
    }

    // Clean up all-offline rooms immediately only if no one is online
    const anyOnline = room.players.some(p => p.online);
    if (!anyOnline) {
      // Keep room for rejoin window
      setTimeout(() => {
        if (rooms[roomCode] && !rooms[roomCode].players.some(p => p.online)) {
          delete rooms[roomCode];
          log(`Room ${roomCode} cleaned up — all players gone`);
        }
      }, 5 * 60 * 1000);
    } else {
      io.to(roomCode).emit('player-joined', {
        players: playerNames(room),
        onlinePlayers: room.players.filter(p => p.online).length
      });
    }

    delete playerRooms[socket.id];
  });
});

function emitRound(roomCode, room) {
  const p = room.currentPuzzle;
  const opts = shuffledOptions(p);
  io.to(roomCode).emit('round-start', {
    roundNumber: room.currentRound + 1,
    totalRounds: room.totalRounds,
    emoji: p.emojis,
    category: 'Telugu Movie',
    hint: p.hint,
    options: opts
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n  🎉 Emoji Guess running → http://localhost:${PORT}\n`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});

module.exports = server;
