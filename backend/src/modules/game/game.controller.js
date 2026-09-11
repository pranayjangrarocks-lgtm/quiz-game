const service = require('./game.service');

exports.createGame = async (req, res, next) => {
  try {
    const { quizId } = req.body;
    if (!quizId) return res.status(400).json({ error: 'quizId is required' });
    const game = await service.createGame(quizId);
    res.status(201).json(game);
  } catch (err) {
    next(err);
  }
};

exports.getGame = async (req, res, next) => {
  try {
    const game = await service.getGameByCode(req.params.code.toUpperCase());
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) {
    next(err);
  }
};
