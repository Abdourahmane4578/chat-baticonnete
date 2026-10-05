const Message = require('../models/Message');

async function createMessage(payload) {
  const message = await Message.create(payload);
  return message.toObject();
}

async function getMessagesByConversation({ conversationId, page = 1, limit = 20 }) {
  const skip = (Number(page) - 1) * Number(limit);

  const [messages, total] = await Promise.all([
    Message.find({
      conversation: conversationId,
      is_deleted: false,
    })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Message.countDocuments({ conversation: conversationId, is_deleted: false }),
  ]);

  return {
    messages: messages.reverse(),
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.max(1, Math.ceil(total / Number(limit))),
  };
}

async function getMessageById(messageId) {
  return Message.findById(messageId).lean();
}

async function updateMessage(messageId, changes) {
  return Message.findByIdAndUpdate(messageId, changes, { new: true }).lean();
}

async function deleteMessage(messageId) {
  return Message.findByIdAndUpdate(
    messageId,
    {
      is_deleted: true,
      deleted_at: new Date(),
      content: '[Message deleted]',
    },
    { new: true }
  ).lean();
}

async function markDelivered(messageId, userId) {
  return Message.findByIdAndUpdate(
    messageId,
    {
      $addToSet: { delivered_to: userId },
      status: 'delivered',
    },
    { new: true }
  ).lean();
}

async function markRead(messageId, userId) {
  return Message.findByIdAndUpdate(
    messageId,
    {
      $addToSet: { read_by: userId },
      status: 'read',
    },
    { new: true }
  ).lean();
}

async function countUnreadForUser(userId) {
  return Message.countDocuments({
    recipient: userId,
    sender: { $ne: userId },
    read_by: { $ne: userId },
    is_deleted: false,
  });
}

module.exports = {
  createMessage,
  getMessagesByConversation,
  getMessageById,
  updateMessage,
  deleteMessage,
  markDelivered,
  markRead,
  countUnreadForUser,
};
