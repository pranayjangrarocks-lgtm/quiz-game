const prisma = require('../../config/db');
const { customAlphabet } = require('nanoid');

// Avoid ambiguous characters (0/O, 1/I) since players type this code manually.
const genCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

async function createGame(quizId) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw Object.assign(new Error('Quiz not found'), { status: 404 });

  let code;
  for (let i = 0; i < 5; i++) {
    const candidate = genCode();
    const existing = await prisma.game.findUnique({ where: { code: candidate } });
    if (!existing) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new Error('Could not generate a unique game code, try again');

  return prisma.game.create({ data: { quizId, code } });
}

async function getGameByCode(code) {
  return prisma.game.findUnique({
    where: { code },
    include: {
      quiz: { include: { questions: { orderBy: { order: 'asc' } } } },
      participants: { orderBy: { score: 'desc' } },
    },
  });
}

async function setGameStatus(code, status, currentIndex) {
  return prisma.game.update({
    where: { code },
    data: {
      status,
      ...(currentIndex !== undefined ? { currentIndex } : {}),
    },
  });
}

async function getLeaderboard(gameId) {
  return prisma.participant.findMany({
    where: { gameId },
    orderBy: { score: 'desc' },
    select: { id: true, name: true, score: true },
  });
}

module.exports = { createGame, getGameByCode, setGameStatus, getLeaderboard };
