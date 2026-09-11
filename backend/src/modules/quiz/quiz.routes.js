const router = require('express').Router();
const controller = require('./quiz.controller');
const adminAuth = require('../../middleware/adminAuth');

router.get('/', controller.listQuizzes);
router.get('/:id', controller.getQuiz);
router.post('/', adminAuth, controller.createQuiz);
router.delete('/:id', adminAuth, controller.deleteQuiz);

module.exports = router;
