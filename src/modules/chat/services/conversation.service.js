const conversationRepository = require('../repositories/conversation.repository');
const messageRepository = require('../repositories/message.repository');
const AppError = require('../../../common/errors/AppError');

async function getOrCreateConversation({ userId, participantId }) {
  if (!userId || !participantId) {
    throw new AppError('Both users are required to start a conversation', 400);
  }

  if (userId === participantId) {
    throw new AppError('A user cannot create a private conversation with themselves', 400);
  }

  const existingConversation = await conversationRepository.getConversationByParticipants(userId, participantId);
  if (existingConversation) {
    return existingConversation;
  }

  const conversation = await conversationRepository.createConversation({
    participantOne: userId,
    participantTwo: participantId,
  });

  return conversation;
}

async function listUserConversations(userId) {
  const conversations = await conversationRepository.getConversationsForUser(userId);
  const unreadCounts = await conversationRepository.countUnreadByConversation(userId);

  return conversations.map((conversation) => ({
    ...conversation,
    unread_count: unreadCounts[conversation._id.toString()]?.unread_count || 0,
    other_participant: unreadCounts[conversation._id.toString()]?.other_participant || null,
  }));
}

async function getConversationDetail({ userId, conversationId }) {
  const conversation = await conversationRepository.getConversationById(conversationId);

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  const isParticipant = [conversation.participant_one, conversation.participant_two].includes(userId);
  if (!isParticipant) {
    throw new AppError('You are not a participant in this conversation', 403);
  }

  return conversation;
}

async function getConversationMessages({ userId, conversationId, page, limit }) {
  const conversation = await getConversationDetail({ userId, conversationId });
  const result = await messageRepository.getMessagesByConversation({
    conversationId: conversation._id,
    page,
    limit,
  });

  return result;
}

module.exports = {
  getOrCreateConversation,
  listUserConversations,
  getConversationDetail,
  getConversationMessages,
};
