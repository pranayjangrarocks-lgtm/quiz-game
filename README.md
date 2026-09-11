# Guess the Song — live YouTube quiz game

A real-time multiplayer quiz where the host queues up YouTube clips, and everyone
(300–400 people at once) races to type the song name before the timer runs out.

## How it works

- **Admin** creates a Quiz (a list of YouTube URLs, each with a clip start time,
  duration, and correct answer) and starts a **Game**, which gets a short join code.
- **Players** open the site, enter the code + their name, and land in the waiting room.
- When the admin clicks **Next question**, everyone's browser plays the same clip at
  the same server-synced time, with a countdown timer.
- Players type a guess once per question. Answers are fuzzy-matched (typo-tolerant)
  against the correct answer and any alternate spellings you provide.
- Points are awarded for correct answers, weighted by speed (faster = more points).
- After each question, the live leaderboard is shown; the admin advances through
  all questions, then the game ends with a final leaderboard.

## Stack

- **Backend**: Node.js, Express, Socket.io, Prisma + PostgreSQL
- **Frontend**: React + Vite, Socket.io client, YouTube IFrame API (no extra npm
  package needed — loaded directly from YouTube)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres instance, and pick a strong ADMIN_SECRET
npm install
npm run prisma:migrate   # creates tables
npm run dev              # starts on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env     # defaults already point at localhost:4000
npm install
npm run dev               # starts on http://localhost:5173
```

Open `http://localhost:5173/admin` to create a quiz and start a game, and
`http://localhost:5173/join` (share this link + the game code with players).

## Creating a quiz

For each question you provide:
- **YouTube URL** — any standard `youtube.com/watch?v=...` or `youtu.be/...` link
- **Start time (s)** — where in the video the clip begins (e.g. `45` = 0:45)
- **Duration (s)** — how long the clip plays and how long players have to answer
- **Correct answer** — the song name (this is what's fuzzy-matched against guesses)
- **Alternate answers** — comma-separated alternate titles/spellings that should also count as correct

The admin secret is sent as a header on quiz/game-creation requests — keep it private;
don't reuse the join link's domain to also expose `/admin` publicly without sharing the secret.

## Notes on running this with 300–400 participants

- The game state that matters for timing (which question is live, when it started)
  is held in memory on the server and broadcast to a Socket.io room per game code —
  this scales comfortably into the thousands on a single small server/process.
- Postgres handles the participant/answer writes; at this scale there's no need for
  a queue or batching.
- If you ever run **multiple backend server processes/instances** behind a load
  balancer, add the [Socket.io Redis adapter](https://socket.io/docs/v4/redis-adapter/)
  so broadcasts reach every player regardless of which instance they're connected to.
  For a single instance (which comfortably handles this scale), it's not needed.
- **Browser autoplay policies**: most browsers only allow audio to autoplay after a
  user gesture on the page. Because players click "Join" before the first clip plays,
  this satisfies that requirement — but keep the join button as the last click before
  gameplay starts, and don't let the page go idle for too long before the first question.
- The video is visually covered (🎵 placeholder) so the YouTube title/thumbnail can't
  spoil the answer, while the audio still plays.
- Consider testing with ~50 simulated players first (multiple browser tabs / a quick
  script emitting `join_game`) before going live with the full 300–400.

## Project structure

```
quiz-game/
├── frontend/          React app (join flow, gameplay, admin panel)
└── backend/           Express API + Socket.io game engine + Prisma schema
```
