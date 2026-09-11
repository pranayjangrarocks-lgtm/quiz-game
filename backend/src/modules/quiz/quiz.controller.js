const service = require('./quiz.service');

exports.createQuiz = async (req, res, next) => {
  try {
    const { title, questions } = req.body;
    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'title and at least one question are required' });
    }
    const quiz = await service.createQuiz(req.body);
    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
};

exports.listQuizzes = async (req, res, next) => {
  try {
    res.json(await service.listQuizzes());
  } catch (err) {
    next(err);
  }
};

exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await service.getQuiz(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    next(err);
  }
};

exports.deleteQuiz = async (req, res, next) => {
  try {
    await service.deleteQuiz(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
