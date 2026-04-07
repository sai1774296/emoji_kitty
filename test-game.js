// This file is for local testing only — not needed in production.
// Run: npm install socket.io-client --no-save && node test-game.js

const { io } = require('socket.io-client');

const SERVER = 'http://localhost:3000';

function createClient(name) {
  const socket = io(SERVER);
  socket.on('connect', () => {
    console.log(`[${name}] connected`);
  });
  return socket;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('Starting test...');
  
  const host = createClient('Host');
  await sleep(500);
  
  host.emit('create-room', { playerName: 'TestHost', totalRounds: 3 });
  
  host.on('room-created', async (data) => {
    console.log('Room created:', data.roomCode);
    
    const player = createClient('Player');
    await sleep(300);
    
    player.emit('join-room', { roomCode: data.roomCode, playerName: 'TestPlayer' }, (res) => {
      console.log('Join result:', res);
      if (res.success) {
        host.emit('start-game', { roomCode: data.roomCode });
      }
    });
    
    player.on('round-start', (round) => {
      console.log('Round:', round.roundNumber, '| Emoji:', round.emoji);
      const answer = 'test-answer';
      player.emit('submit-guess', { roomCode: data.roomCode, guess: answer });
    });
    
    player.on('guess-result', (result) => {
      console.log('Guess result:', result);
    });
    
    host.on('game-over', (data) => {
      console.log('Game over! Leaderboard:', data.leaderboard);
      process.exit(0);
    });
  });
}

runTest().catch(console.error);
