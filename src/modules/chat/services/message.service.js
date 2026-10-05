const messageRepository = require('../repositories/message.repository');
const conversationRepository = require('../repositories/conversation.repository');
const AppError = require('../../../common/errors/AppError');

async function sendMessage({ senderId, conversationId, content, replyTo = null }) {
  if (!senderId || !conversationId) {
    throw new AppError('Sender and conversation are required', 400);
  }

  const conversation = await conversationRepository.getConversationById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  const isParticipant = [conversation.participant_one, conversation.participant_two].includes(senderId);
  if (!isParticipant) {
    throw new AppError('You are not allowed to send messages in this conversation', 403);
  }

  const trimmedContent = typeof content === 'string' ? content.trim() : '';
  if (!trimmedContent) {
    throw new AppError('Message content cannot be empty', 400);
  }

  const recipient = conversation.participant_one === senderId ? conversation.participant_two : conversation.participant_one;
  const message = await messageRepository.createMessage({
    conversation: conversation._id,
    sender: senderId,
    recipient,
    content: trimmedContent,
    reply_to: replyTo || null,
    status: 'sent',
  });

  await conversationRepository.updateLastMessage(conversation._id, message._id, message.created_at || new Date());

  return {
    ...message,
    conversation_id: conversation._id,
  };
}

async function updateMessage({ messageId, userId, content }) {
  const message = await messageRepository.getMessageById(messageId);
  if (!message || message.is_deleted) {
    throw new AppError('Message not found', 404);
  }

  if (message.sender !== userId) {
    throw new AppError('You are not allowed to edit this message', 403);
  }

  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (!trimmed) {
    throw new AppError('Updated content cannot be empty', 400);
  }

  const updated = await messageRepository.updateMessage(messageId, {
    content: trimmed,
    edited: true,
    edited_at: new Date(),
  });

  return updated;
}

async function deleteMessage({ messageId, userId }) {
  const message = await messageRepository.getMessageById(messageId);
  if (!message || message.is_deleted) {
    throw new AppError('Message not found', 404);
  }

  if (message.sender !== userId) {
    throw new AppError('You are not allowed to delete this message', 403);
  }

  return messageRepository.deleteMessage(messageId);
}

async function markMessageDelivered({ messageId, userId }) {
  const message = await messageRepository.getMessageById(messageId);
  if (!message || message.is_deleted) {
    throw new AppError('Message not found', 404);
  }

  if (message.recipient !== userId && message.sender !== userId) {
    throw new AppError('You are not a participant of this message', 403);
  }

  const updated = await messageRepository.markDelivered(messageId, userId);
  return updated;
}

async function markMessageRead({ messageId, userId }) {
  const message = await messageRepository.getMessageById(messageId);
  if (!message || message.is_deleted) {
    throw new AppError('Message not found', 404);
  }

  if (message.recipient !== userId && message.sender !== userId) {
    throw new AppError('You are not a participant of this message', 403);
  }

  const updated = await messageRepository.markRead(messageId, userId);
  return updated;
}

async function getUnreadCounts(userId) {
  if (!userId) {
    throw new AppError('User identifier is required', 400);
  }

  const total = await messageRepository.countUnreadForUser(userId);
  return { total_unread: total };
}

module.exports = {
  sendMessage,
  updateMessage,
  deleteMessage,
  markMessageDelivered,
  markMessageRead,
  getUnreadCounts,
};
