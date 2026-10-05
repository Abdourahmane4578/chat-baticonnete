const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const buildParticipantsKey = require('../../../common/utils/participantKey');

async function getConversationByParticipants(userA, userB) {
  const key = buildParticipantsKey(userA, userB);
  return Conversation.findOne({ participants_key: key, is_deleted: false }).lean();
}

async function createConversation({ participantOne, participantTwo }) {
  const conversation = await Conversation.create({
    participant_one: participantOne,
    participant_two: participantTwo,
  });

  return conversation.toObject();
}

async function getConversationById(conversationId) {
  return Conversation.findById(conversationId).populate('last_message_id').lean();
}

async function getConversationsForUser(userId) {
  return Conversation.find({
    $or: [{ participant_one: userId }, { participant_two: userId }],
    is_deleted: false,
  })
    .sort({ last_message_at: -1, updated_at: -1 })
    .lean();
}

async function updateLastMessage(conversationId, messageId, atDate) {
  return Conversation.findByIdAndUpdate(
    conversationId,
    {
      last_message_id: messageId,
      last_message_at: atDate,
      updated_at: new Date(),
    },
    { new: true }
  );
}

async function countUnreadByConversation(userId) {
  const conversations = await Conversation.find({
    $or: [{ participant_one: userId }, { participant_two: userId }],
    is_deleted: false,
  }).lean();

  const counts = {};

  for (const conversation of conversations) {
    const conversationId = conversation._id.toString();
    const unreadCount = await Message.countDocuments({
      conversation: conversationId,
      recipient: userId,
      sender: { $ne: userId },
      read_by: { $ne: userId },
      is_deleted: false,
    });

    counts[conversationId] = {
      unread_count: unreadCount,
      other_participant: conversation.participant_one === userId ? conversation.participant_two : conversation.participant_one,
    };
  }

  return counts;
}

module.exports = {
  getConversationByParticipants,
  createConversation,
  getConversationById,
  getConversationsForUser,
  updateLastMessage,
  countUnreadByConversation,
};
