const { asyncHandler } = require('../../../common/errors/errorHandler');
const messageService = require('../services/message.service');

const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { conversation_id, content, reply_to } = req.body;

  const message = await messageService.sendMessage({
    senderId: userId,
    conversationId: conversation_id,
    content,
    replyTo: reply_to,
  });

  return res.status(201).json({
    success: true,
    data: message,
  });
});

const getUnreadCounts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const counts = await messageService.getUnreadCounts(userId);

  return res.status(200).json({
    success: true,
    data: counts,
  });
});

const updateMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;
  const { content } = req.body;

  const message = await messageService.updateMessage({
    messageId,
    userId,
    content,
  });

  return res.status(200).json({
    success: true,
    data: message,
  });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await messageService.deleteMessage({ messageId, userId });

  return res.status(200).json({
    success: true,
    data: message,
  });
});

const markDelivered = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await messageService.markMessageDelivered({ messageId, userId });

  return res.status(200).json({
    success: true,
    data: message,
  });
});

const markRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await messageService.markMessageRead({ messageId, userId });

  return res.status(200).json({
    success: true,
    data: message,
  });
});

module.exports = {
  sendMessage,
  getUnreadCounts,
  updateMessage,
  deleteMessage,
  markDelivered,
  markRead,
};
