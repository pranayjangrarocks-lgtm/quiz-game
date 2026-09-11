const { Server } = require('socket.io');
const gameService = require('../modules/game/game.service');
const participantService = require('../modules/participant/participant.service');
const { extractVideoId } = require('../utils/youtube');
const { isMatch } = require('../utils/matchAnswer');
const { adminSecret, clientOrigin } = require('../config/env');
const prisma = require('../config/db');

// In-memory runtime state per game code. This is the source of truth for
// question timing (so 300-400 clients all see the same countdown), while
// Postgres remains the source of truth for scores/participants.
//
// activeGames.get(code) => {
//   dbGameId, questions, currentIndex, questionStartAt, timer, answeredParticipantIds
// }
const activeGames = new Map();

function room(code) {
  return `game:${code}`;
}
function adminRoom(code) {
  return `game:${code}:admin`;
}

function initGameSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        "https://quiz-game-mu-nine.vercel.app",
        "https://quiz-game-git-main-pranayjangrarocks-lgtm.vercel.app",
        "http://localhost:5173"
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_game', async ({ code, name }, cb) => {
      try {
        if (!code || !name) return cb?.({ error: 'Code and name are required' });
        const gameCode = code.trim().toUpperCase();
        const game = await gameService.getGameByCode(gameCode);
        if (!game) return cb?.({ error: 'Game not found' });
        if (game.status === 'FINISHED') return cb?.({ error: 'This game has already ended' });

        const participant = await participantService.joinGame(game.id, name.trim());
        await participantService.updateSocketId(participant.id, socket.id);

        socket.data.participantId = participant.id;
        socket.data.gameCode = gameCode;
        socket.join(room(gameCode));

        cb?.({
          participant,
          game: {
            code: game.code,
            status: game.status,
            currentIndex: game.currentIndex,
            quizTitle: game.quiz.title,
            totalQuestions: game.quiz.questions.length,
          },
        });

        io.to(room(gameCode)).emit('participant:joined', {
          name: participant.name,
          count: game.participants.length + 1,
        });
      } catch (err) {
        console.error(err);
        cb?.({ error: 'Failed to join game' });
      }
    });

    socket.on('admin:join', async ({ code, secret }, cb) => {
      if (secret !== adminSecret) return cb?.({ error: 'Unauthorized' });
      const gameCode = code.trim().toUpperCase();
      socket.join(adminRoom(gameCode));
      socket.join(room(gameCode));
      cb?.({ ok: true });
    });

    socket.on('admin:next_question', async ({ code, secret }) => {
      if (secret !== adminSecret) return;
      await startNextQuestion(io, code.trim().toUpperCase());
    });

    socket.on('admin:end_game', async ({ code, secret }) => {
      if (secret !== adminSecret) return;
      await endGame(io, code.trim().toUpperCase());
    });

    socket.on('submit_answer', async ({ code, answer }, cb) => {
      try {
        const gameCode = (code || socket.data.gameCode || '').toUpperCase();
        const state = activeGames.get(gameCode);
        const participantId = socket.data.participantId;

        if (!state || !participantId || state.currentIndex < 0) {
          return cb?.({ error: 'No active question' });
        }
        if (state.answeredParticipantIds.has(participantId)) {
          return cb?.({ error: 'You already answered this question' });
        }

        const question = state.questions[state.currentIndex];
        const now = Date.now();
        const timeTakenMs = now - state.questionStartAt;
        if (timeTakenMs > question.duration * 1000 + 1000) {
          return cb?.({ error: 'Time is up' });
        }

        state.answeredParticipantIds.add(participantId);

        const correct = isMatch(answer, [question.answer, ...(question.altAnswers || [])]);
        let pointsAwarded = 0;
        if (correct) {
          const durationMs = question.duration * 1000;
          const speedFactor = Math.max(0, 1 - timeTakenMs / durationMs);
          // Half the points for a correct answer, up to full points for instant answers.
          pointsAwarded = Math.round(question.points * (0.5 + 0.5 * speedFactor));
        }

        await prisma.answer.upsert({
          where: { participantId_questionId: { participantId, questionId: question.id } },
          update: { answerText: answer, isCorrect: correct, timeTakenMs, pointsAwarded },
          create: {
            participantId,
            questionId: question.id,
            answerText: answer,
            isCorrect: correct,
            timeTakenMs,
            pointsAwarded,
          },
        });

        if (pointsAwarded > 0) {
          await participantService.incrementScore(participantId, pointsAwarded);
        }

        cb?.({ correct, pointsAwarded });

        io.to(adminRoom(gameCode)).emit('answer:received', {
          participantId,
          correct,
          pointsAwarded,
          answeredCount: state.answeredParticipantIds.size,
        });
      } catch (err) {
        console.error(err);
        cb?.({ error: 'Failed to submit answer' });
      }
    });

    socket.on('disconnect', () => {
      // Participants are identified by name within a game and can safely
      // reconnect (e.g. after a network blip) without losing their score.
    });
  });

  return io;
}

async function startNextQuestion(io, code) {
  let state = activeGames.get(code);

  if (!state) {
    const game = await gameService.getGameByCode(code);
    if (!game) return;
    state = {
      dbGameId: game.id,
      questions: game.quiz.questions,
      currentIndex: -1,
      questionStartAt: null,
      timer: null,
      answeredParticipantIds: new Set(),
    };
    activeGames.set(code, state);
    await gameService.setGameStatus(code, 'ACTIVE');
  }

  if (state.timer) clearTimeout(state.timer);

  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.questions.length) {
    return endGame(io, code);
  }

  state.currentIndex = nextIndex;
  state.answeredParticipantIds = new Set();
  state.questionStartAt = Date.now();
  await gameService.setGameStatus(code, 'ACTIVE', nextIndex);

  const question = state.questions[nextIndex];
  const videoId = extractVideoId(question.youtubeUrl);

  io.to(room(code)).emit('question:start', {
    index: nextIndex,
    total: state.questions.length,
    videoId,
    startTime: question.startTime,
    duration: question.duration,
    serverTime: state.questionStartAt,
  });

  state.timer = setTimeout(async () => {
    try {
      const leaderboard = await gameService.getLeaderboard(state.dbGameId);
      io.to(room(code)).emit('question:end', {
        index: nextIndex,
        correctAnswer: question.answer,
        leaderboard,
      });
    } catch (err) {
      console.error(err);
    }
  }, question.duration * 1000);
}

async function endGame(io, code) {
  const state = activeGames.get(code);
  if (state?.timer) clearTimeout(state.timer);

  await gameService.setGameStatus(code, 'FINISHED');

  const dbGameId = state?.dbGameId || (await gameService.getGameByCode(code))?.id;
  const leaderboard = dbGameId ? await gameService.getLeaderboard(dbGameId) : [];

  io.to(room(code)).emit('game:end', { leaderboard });
  activeGames.delete(code);
}

module.exports = { initGameSocket };
