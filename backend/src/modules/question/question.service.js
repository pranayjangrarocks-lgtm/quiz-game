const prisma = require('../../config/db');

async function addQuestion(quizId, data) {
  const count = await prisma.question.count({ where: { quizId } });
  return prisma.question.create({
    data: {
      quizId,
      order: data.order ?? count,
      youtubeUrl: data.youtubeUrl,
      startTime: data.startTime ?? 0,
      duration: data.duration ?? 20,
      answer: data.answer,
      altAnswers: data.altAnswers ?? [],
      points: data.points ?? 1000,
    },
  });
}

async function updateQuestion(id, data) {
  return prisma.question.update({ where: { id }, data });
}

async function deleteQuestion(id) {
  return prisma.question.delete({ where: { id } });
}

module.exports = { addQuestion, updateQuestion, deleteQuestion };
