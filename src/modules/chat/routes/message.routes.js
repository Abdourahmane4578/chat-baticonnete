const express = require('express');
const messageController = require('../controllers/message.controller');
const { validateSendMessage, validateUpdateMessage } = require('../validators/message.validator');

const router = express.Router();

router.get('/unread-count', messageController.getUnreadCounts);
router.post('/', validateSendMessage, messageController.sendMessage);
router.patch('/:messageId', validateUpdateMessage, messageController.updateMessage);
router.delete('/:messageId', messageController.deleteMessage);
router.post('/:messageId/delivered', messageController.markDelivered);
router.post('/:messageId/read', messageController.markRead);

module.exports = router;
