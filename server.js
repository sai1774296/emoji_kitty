const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const allPuzzles = require('./puzzles');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};
const HOST_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Track which puzzles each room has already used (for rotation across sessions)
const roomPuzzleHistory = {};

function getRandomPuzzles(roomCode, count = 15) {
  if (!roomPuzzleHistory[roomCode]) {
    roomPuzzleHistory[roomCode] = [];
  }
  const used = roomPuzzleHistory[roomCode];
  // Get puzzles not yet used
  let available = allPuzzles.filter((_, i) => !used.includes(i));
  // If not enough fresh ones, reset history
  if (available.length < count) {
    roomPuzzleHistory[roomCode] = [];
    available = [...allPuzzles];
  }
  // Shuffle available
  const shuffled = available
    .map((p, originalIndex) => ({ p, originalIndex: allPuzzles.indexOf(p) }))
    .sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  // Mark as used
  selected.forEach(({ originalIndex }) => {
    roomPuzzleHistory[roomCode].push(originalIndex);
  });
  return selected.map(({ p }) => p);
}

function shuffleOptions(options) {
  return [...options].sort(() => Math.random() - 0.5);
}

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('create-room', ({ name, rounds }) => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const puzzles = getRandomPuzzles(roomCode, parseInt(rounds) || 15);
    rooms[roomCode] = {
      host: socket.id,
      hostName: name,
      players: {},
      puzzles,
      currentRound: 0,
      started: false,
      hostTimeout: null,
      totalRounds: parseInt(rounds) || 15
    };
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.isHost = true;
    socket.playerName = name;
    socket.emit('room-created', { roomCode });
    console.log(`Room ${roomCode} created by ${name}`);
  });

  socket.on('join-room', ({ name, roomCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if this is a rejoin (player with same name already existed)
    const existingPlayer = Object.values(room.players).find(p => p.name === name);
    const isRejoin = !!existingPlayer;
    let savedScore = 0;

    if (isRejoin) {
      // Remove old socket entry, keep score
      const oldSocketId = Object.keys(room.players).find(id => room.players[id].name === name);
      if (oldSocketId) {
        savedScore = room.players[oldSocketId].score || 0;
        delete room.players[oldSocketId];
      }
    }

    // Check if this is the host rejoining
    if (name === room.hostName) {
      // Clear host timeout
      if (room.hostTimeout) {
        clearTimeout(room.hostTimeout);
        room.hostTimeout = null;
      }
      room.host = socket.id;
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.isHost = true;
      socket.playerName = name;
      socket.emit('host-rejoined', {
        roomCode,
        currentRound: room.currentRound,
        players: Object.values(room.players).map(p => ({ name: p.name, score: p.score })),
        started: room.started
      });
      console.log(`Host ${name} rejoined room ${roomCode}`);
      return;
    }

    room.players[socket.id] = {
      name,
      score: savedScore,
      alreadyGuessed: false
    };

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.isHost = false;
    socket.playerName = name;

    socket.emit('joined', {
      name,
      roomCode,
      score: savedScore,
      isRejoin
    });

    io.to(roomCode).emit('player-joined', {
      name,
      players: Object.values(room.players).map(p => ({ name: p.name, score: p.score }))
    });

    console.log(`${name} ${isRejoin ? 're' : ''}joined room ${roomCode} with score ${savedScore}`);
  });

  socket.on('start-game', () => {
    const room = rooms[socket.roomCode];
    if (!room || room.host !== socket.id) return;
    room.started = true;
    room.currentRound = 0;
    startRound(socket.roomCode);
  });

  socket.on('next-round', () => {
    const room = rooms[socket.roomCode];
    if (!room || room.host !== socket.id) return;
    room.currentRound++;
    if (room.currentRound >= room.puzzles.length) {
      endGame(socket.roomCode);
    } else {
      startRound(socket.roomCode);
    }
  });

  socket.on('submit-answer', ({ answer }) => {
    const room = rooms[socket.roomCode];
    if (!room || !room.started) return;
    const player = room.players[socket.id];
    if (!player || player.alreadyGuessed) return;

    const puzzle = room.puzzles[room.currentRound];
    const isCorrect = answer.trim().toLowerCase() === puzzle.answer.trim().toLowerCase();

    if (isCorrect) {
      player.score += 10;
      player.alreadyGuessed = true;
      socket.emit('answer-result', { correct: true, answer: puzzle.answer });
      io.to(socket.roomCode).emit('correct-guess', {
        name: player.name,
        answer: puzzle.answer,
        players: Object.values(room.players).map(p => ({ name: p.name, score: p.score }))
      });
    } else {
      socket.emit('answer-result', { correct: false });
    }
  });

  socket.on('end-game', () => {
    const room = rooms[socket.roomCode];
    if (!room || room.host !== socket.id) return;
    endGame(socket.roomCode);
  });

  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms[roomCode]) return;
    const room = rooms[roomCode];

    if (socket.isHost) {
      console.log(`Host disconnected from room ${roomCode}, starting 5-min timeout`);
      io.to(roomCode).emit('host-disconnected');
      room.hostTimeout = setTimeout(() => {
        io.to(roomCode).emit('room-closed');
        delete rooms[roomCode];
        console.log(`Room ${roomCode} destroyed after host timeout`);
      }, HOST_TIMEOUT);
    } else {
      // Keep player in room with their score for rejoin
      const player = room.players[socket.id];
      if (player) {
        console.log(`Player ${player.name} disconnected, score ${player.score} preserved`);
        // Don't delete from room.players yet - allow rejoin
        // Mark as disconnected but keep entry
        room.players[socket.id].disconnected = true;
      }
      io.to(roomCode).emit('player-left', {
        name: player ? player.name : 'unknown',
        players: Object.values(room.players)
          .filter(p => !p.disconnected)
          .map(p => ({ name: p.name, score: p.score }))
      });
    }
  });
});

function startRound(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  // Reset alreadyGuessed for all players
  Object.values(room.players).forEach(p => { p.alreadyGuessed = false; });

  const puzzle = room.puzzles[room.currentRound];
  const shuffledOptions = shuffleOptions(puzzle.options);

  io.to(roomCode).emit('round-start', {
    round: room.currentRound + 1,
    total: room.puzzles.length,
    emoji: puzzle.emoji,
    hint: puzzle.hint,
    options: shuffledOptions
  });
  console.log(`Room ${roomCode} - Round ${room.currentRound + 1}: ${puzzle.answer}`);
}

function endGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const finalScores = Object.values(room.players)
    .sort((a, b) => b.score - a.score)
    .map(p => ({ name: p.name, score: p.score }));

  io.to(roomCode).emit('game-over', { finalScores });
  console.log(`Game over in room ${roomCode}`);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
