const router = require('express').Router();
const controller = require('./game.controller');
const adminAuth = require('../../middleware/adminAuth');

router.post('/', adminAuth, controller.createGame);
router.get('/:code', controller.getGame);

module.exports = router;
