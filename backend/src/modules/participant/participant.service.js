const prisma = require('../../config/db');

async function joinGame(gameId, name) {
  // Upsert so a participant who refreshes/reconnects keeps their existing score.
  return prisma.participant.upsert({
    where: { gameId_name: { gameId, name } },
    update: {},
    create: { gameId, name },
  });
}

async function updateSocketId(participantId, socketId) {
  return prisma.participant.update({ where: { id: participantId }, data: { socketId } });
}

async function incrementScore(participantId, points) {
  return prisma.participant.update({
    where: { id: participantId },
    data: { score: { increment: points } },
  });
}

module.exports = { joinGame, updateSocketId, incrementScore };
