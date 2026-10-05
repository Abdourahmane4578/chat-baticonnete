const express = require('express');
const conversationController = require('../controllers/conversation.controller');
const { validateGetOrCreateConversation } = require('../validators/conversation.validator');

const router = express.Router();

router.post('/find-or-create', validateGetOrCreateConversation, conversationController.getOrCreateConversation);
router.get('/', conversationController.listConversations);
router.get('/:conversationId/messages', conversationController.getConversationMessages);

module.exports = router;
