const test = require('node:test');
const assert = require('node:assert/strict');

const conversationRepository = require('../../src/modules/chat/repositories/conversation.repository');
const messageRepository = require('../../src/modules/chat/repositories/message.repository');
const conversationService = require('../../src/modules/chat/services/conversation.service');
const messageService = require('../../src/modules/chat/services/message.service');

test('conversationService returns an existing conversation without creating a duplicate', async () => {
  const original = conversationRepository.getConversationByParticipants;
  conversationRepository.getConversationByParticipants = async () => ({ _id: 'conversation-1', participant_one: '100', participant_two: '200' });
  conversationRepository.createConversation = async () => {
    throw new Error('createConversation should not be called for an existing conversation');
  };

  try {
    const conversation = await conversationService.getOrCreateConversation({ userId: '100', participantId: '200' });
    assert.deepEqual(conversation, { _id: 'conversation-1', participant_one: '100', participant_two: '200' });
  } finally {
    conversationRepository.getConversationByParticipants = original;
    delete conversationRepository.createConversation;
  }
});

test('conversationService creates a new conversation when none exists', async () => {
  const originalFind = conversationRepository.getConversationByParticipants;
  const originalCreate = conversationRepository.createConversation;

  conversationRepository.getConversationByParticipants = async () => null;
  conversationRepository.createConversation = async ({ participantOne, participantTwo }) => ({
    _id: 'new-conversation',
    participant_one: participantOne,
    participant_two: participantTwo,
    participants_key: '100:200',
  });

  try {
    const conversation = await conversationService.getOrCreateConversation({ userId: '100', participantId: '200' });
    assert.equal(conversation._id, 'new-conversation');
    assert.equal(conversation.participant_one, '100');
    assert.equal(conversation.participant_two, '200');
  } finally {
    conversationRepository.getConversationByParticipants = originalFind;
    conversationRepository.createConversation = originalCreate;
  }
});

test('messageService sends a valid message and updates the conversation last message metadata', async () => {
  const originalConversation = conversationRepository.getConversationById;
  const originalUpdateLastMessage = conversationRepository.updateLastMessage;
  const originalCreateMessage = messageRepository.createMessage;

  const conversation = {
    _id: 'conversation-1',
    participant_one: '100',
    participant_two: '200',
  };

  conversationRepository.getConversationById = async () => conversation;
  conversationRepository.updateLastMessage = async () => ({ ok: true });
  messageRepository.createMessage = async (payload) => ({
    _id: 'message-1',
    ...payload,
    created_at: new Date('2025-01-01T10:00:00.000Z'),
  });

  try {
    const message = await messageService.sendMessage({
      senderId: '100',
      conversationId: 'conversation-1',
      content: '  Bonjour  ',
    });

    assert.equal(message.content, 'Bonjour');
    assert.equal(message.recipient, '200');
    assert.equal(message.sender, '100');
    assert.equal(message.conversation_id, 'conversation-1');
    assert.equal(message.status, 'sent');
  } finally {
    conversationRepository.getConversationById = originalConversation;
    conversationRepository.updateLastMessage = originalUpdateLastMessage;
    messageRepository.createMessage = originalCreateMessage;
  }
});

test('messageService rejects empty message content', async () => {
  const original = conversationRepository.getConversationById;
  conversationRepository.getConversationById = async () => ({
    _id: 'conversation-1',
    participant_one: '100',
    participant_two: '200',
  });

  try {
    await assert.rejects(
      () => messageService.sendMessage({ senderId: '100', conversationId: 'conversation-1', content: '   ' }),
      /Message content cannot be empty/
    );
  } finally {
    conversationRepository.getConversationById = original;
  }
});

test('messageService updates a message only if the sender is the author', async () => {
  const original = messageRepository.getMessageById;
  const originalUpdate = messageRepository.updateMessage;

  messageRepository.getMessageById = async () => ({
    _id: 'message-1',
    sender: '100',
    content: 'old message',
    is_deleted: false,
  });
  messageRepository.updateMessage = async () => ({
    _id: 'message-1',
    sender: '100',
    content: 'new message',
    edited: true,
  });

  try {
    const updated = await messageService.updateMessage({
      messageId: 'message-1',
      userId: '100',
      content: '  new message  ',
    });

    assert.equal(updated.content, 'new message');
    assert.equal(updated.edited, true);

    await assert.rejects(
      () => messageService.updateMessage({
        messageId: 'message-1',
        userId: '200',
        content: 'new message',
      }),
      /not allowed to edit/
    );
  } finally {
    messageRepository.getMessageById = original;
    messageRepository.updateMessage = originalUpdate;
  }
});
