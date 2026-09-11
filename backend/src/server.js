const express = require('express');
const cors = require('cors');
const http = require('http');

const { clientOrigin, port } = require('./config/env');
const { initGameSocket } = require('./socket/gameSocket');
const errorHandler = require('./middleware/errorHandler');

const quizRoutes = require('./modules/quiz/quiz.routes');
const questionRoutes = require('./modules/question/question.routes');
const gameRoutes = require('./modules/game/game.routes');

const app = express();
app.use(cors({
  origin: [
    "https://quiz-game-mu-nine.vercel.app",
    "https://quiz-game-git-main-pranayjangrarocks-lgtm.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/games', gameRoutes);

app.use(errorHandler);

const server = http.createServer(app);
initGameSocket(server);

server.listen(port, () => {
  console.log(`Quiz game server listening on port ${port}`);
});
