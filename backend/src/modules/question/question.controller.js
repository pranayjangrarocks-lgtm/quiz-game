const service = require('./question.service');

exports.addQuestion = async (req, res, next) => {
  try {
    const q = await service.addQuestion(req.params.quizId, req.body);
    res.status(201).json(q);
  } catch (err) {
    next(err);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    res.json(await service.updateQuestion(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    await service.deleteQuestion(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
