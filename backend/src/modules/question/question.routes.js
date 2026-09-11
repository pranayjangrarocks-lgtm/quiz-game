const router = require('express').Router();
const controller = require('./question.controller');
const adminAuth = require('../../middleware/adminAuth');

router.post('/quiz/:quizId', adminAuth, controller.addQuestion);
router.patch('/:id', adminAuth, controller.updateQuestion);
router.delete('/:id', adminAuth, controller.deleteQuestion);

module.exports = router;
