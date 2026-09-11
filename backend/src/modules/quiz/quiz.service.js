const prisma = require('../../config/db');

async function createQuiz({ title, description, questions = [] }) {
  return prisma.quiz.create({
    data: {
      title,
      description,
      questions: {
        create: questions.map((q, idx) => ({
          order: q.order ?? idx,
          youtubeUrl: q.youtubeUrl,
          startTime: q.startTime ?? 0,
          duration: q.duration ?? 20,
          answer: q.answer,
          altAnswers: q.altAnswers ?? [],
          points: q.points ?? 1000,
        })),
      },
    },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
}

async function listQuizzes() {
  return prisma.quiz.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function getQuiz(id) {
  return prisma.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
}

async function deleteQuiz(id) {
  return prisma.quiz.delete({ where: { id } });
}

module.exports = { createQuiz, listQuizzes, getQuiz, deleteQuiz };
