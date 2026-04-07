/**
 * Emoji Guess — Kitty Party Edition
 * Node.js + Express + Socket.IO Server
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
const playerRooms = {};

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

io.on('connection', (socket) => {
  log(`Connected: ${socket.id}`);

  socket.on('create-room', (data) => {
    const roomCode = uniqueRoomCode();
    const hostName = data?.playerName || data?.name || 'Host';
    const totalRounds = Math.min(Math.max(data?.totalRounds || 10, 1), 50);

    rooms[roomCode] = {
      host: socket.id,
      players: [{ id: socket.id, name: hostName, score: 0 }],
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

  socket.on('join-room', (data, callback) => {
    const cb = typeof callback === 'function' ? callback : () => {};
    const roomCode = data?.roomCode?.toUpperCase();
    const name = data?.playerName || data?.name;

    if (!roomCode || !name) return cb({ error: 'Room code and name are required' });

    const room = rooms[roomCode];
    if (!room) return cb({ error: 'Room not found. Check the code and try again.' });
    if (room.roundActive) return cb({ error: 'Game already in progress. Wait for the next game.' });
    if (room.players.find(p => p.name === name)) return cb({ error: 'That name is taken — pick another!' });

    room.players.push({ id: socket.id, name, score: 0 });
    playerRooms[socket.id] = roomCode;
    socket.join(roomCode);
    log(`${name} joined room ${roomCode}`);

    cb({ success: true, totalRounds: room.totalRounds, players: playerNames(room) });

    io.to(roomCode).emit('player-joined', {
      players: playerNames(room),
      onlinePlayers: room.players.length
    });
  });

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

  socket.on('submit-guess', (data) => {
    const roomCode = data?.roomCode || playerRooms[socket.id];
    const room = rooms[roomCode];
    if (!room || !room.roundActive) return;
    if (room.guessedThisRound.has(socket.id)) return;

    const guess = (data.guess || '').trim().toLowerCase();
    if (!guess) return;

    const isCorrect = room.currentPuzzle.answers.some(a => a.toLowerCase() === guess);

    if (isCorrect) {
      room.roundScorers += 1;
      room.guessedThisRound.add(socket.id);

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

  socket.on('next-round', (data) => {
    const roomCode = data?.roomCode || playerRooms[socket.id];
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id) return;

    io.to(roomCode).emit('round-end', {
      roundNumber: room.currentRound + 1,
      answer: room.currentPuzzle.answers[0],
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

  socket.on('end-game', (data) => {
    const roomCode = data?.roomCode || playerRooms[socket.id];
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id) return;

    room.roundActive = false;
    log(`Game manually ended in ${roomCode}`);
    io.to(roomCode).emit('game-over', { leaderboard: leaderboard(room) });
  });

  socket.on('disconnect', () => {
    const roomCode = playerRooms[socket.id];
    if (!roomCode || !rooms[roomCode]) { delete playerRooms[socket.id]; return; }

    const room = rooms[roomCode];
    const idx = room.players.findIndex(p => p.id === socket.id);
    if (idx === -1) { delete playerRooms[socket.id]; return; }

    const player = room.players[idx];
    room.players.splice(idx, 1);
    log(`${player.name} disconnected from ${roomCode}`);

    if (socket.id === room.host) {
      io.to(roomCode).emit('host-disconnected', { message: 'Host left — game ended.' });
      delete rooms[roomCode];
    } else if (room.players.length === 0) {
      delete rooms[roomCode];
    } else {
      io.to(roomCode).emit('player-joined', {
        players: playerNames(room),
        onlinePlayers: room.players.length
      });
    }

    delete playerRooms[socket.id];
  });
});

function emitRound(roomCode, room) {
  const p = room.currentPuzzle;
  io.to(roomCode).emit('round-start', {
    roundNumber: room.currentRound + 1,
    totalRounds: room.totalRounds,
    emoji: p.emojis,
    category: p.category,
    hint: p.hint
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
