const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channel.controller');
const { auth } = require('../middleware/auth.middleware');

router.get('/:channelId/messages', auth, channelController.getMessages);
router.post('/:channelId/messages', auth, channelController.addMessage);

module.exports = router;