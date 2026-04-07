# Emoji Guess 🎉 — Kitty Party Edition

A real-time multiplayer emoji guessing game built for Indian kitty party gatherings. Players decode emoji clues to guess Telugu movies, Indian food, festivals, and more!

## How It Works

Host creates a room → shares the code → players join on their phones → host starts rounds → players race to guess the emoji puzzle → leaderboard at the end.

### For the Host
1. Open the app → tap Create Game
2. Enter your name, pick number of rounds → get a Room Code
3. Share the code with players (WhatsApp, verbally)
4. Tap Start Game when everyone's in
5. Control the pace with Next Round / End Game

### For Players
1. Open the shared link → tap Join Game
2. Enter room code + your name
3. See emoji clues → type your guess
4. First correct guess = 10 pts, second = 7, third = 5, rest = 2

## Tech Stack

- Frontend: Vanilla HTML/CSS/JS (single-file, no build step)
- Backend: Node.js + Express + Socket.IO
- Deployment: Railway (Docker)
- Database: None — in-memory game state

## Puzzle Categories

- 🎬 Telugu Movies (Baahubali, RRR, Pushpa, Arjun Reddy...)
- 🍛 Indian Food (Biryani, Dosa, Samosa, Pani Puri...)
- 🪔 Festivals (Diwali, Sankranti, Bathukamma, Ugadi...)
- 🌟 Tollywood Actors
- 🏛️ Famous Places

50+ puzzles with multiple accepted answers per puzzle.

## Run Locally

```bash
git clone https://github.com/sai1774296/emoji_kitty.git
cd emoji_kitty
npm install
npm start
```

Open http://localhost:3000 on your phone (same Wi-Fi network).

## Deploy to Railway

1. Push this repo to GitHub
2. Connect the repo on [Railway](https://railway.app)
3. Railway auto-detects the Dockerfile and deploys
4. Share the generated URL with your kitty party group!

## Project Structure

```
emoji-guess/
├── server.js          # Express + Socket.IO server
├── puzzles.js         # 50+ emoji puzzle dataset
├── public/
│   └── index.html     # Complete frontend (HTML + CSS + JS)
├── Dockerfile         # Production container
├── railway.toml       # Railway deploy config
├── package.json
└── README.md
```

## License

MIT
