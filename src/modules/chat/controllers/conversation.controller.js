const { asyncHandler } = require('../../../common/errors/errorHandler');
const conversationService = require('../services/conversation.service');

const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { participant_id } = req.body;
  const userId = req.user.id;

  const conversation = await conversationService.getOrCreateConversation({
    userId,
    participantId: participant_id,
  });

  return res.status(200).json({
    success: true,
    data: conversation,
  });
});

const listConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const conversations = await conversationService.listUserConversations(userId);

  return res.status(200).json({
    success: true,
    data: conversations,
  });
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user.id;

  const result = await conversationService.getConversationMessages({
    userId,
    conversationId,
    page: Number(page),
    limit: Number(limit),
  });

  return res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  getOrCreateConversation,
  listConversations,
  getConversationMessages,
};
