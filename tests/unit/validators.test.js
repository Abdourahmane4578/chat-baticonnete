const test = require('node:test');
const assert = require('node:assert/strict');

const { validateGetOrCreateConversation } = require('../../src/modules/chat/validators/conversation.validator');
const { validateSendMessage, validateUpdateMessage } = require('../../src/modules/chat/validators/message.validator');

test('conversation validator requires participant_id', async () => {
  const capture = (handler, req) => new Promise((resolve) => handler(req, {}, (error) => resolve(error)));

  const error = await capture(validateGetOrCreateConversation, { body: {} });
  assert.ok(error);
  assert.equal(error.statusCode, 400);
  assert.match(error.message, /participant_id is required/i);
});

test('message validator requires conversation_id and content', async () => {
  const capture = (handler, req) => new Promise((resolve) => handler(req, {}, (error) => resolve(error)));

  const emptyConversationError = await capture(validateSendMessage, { body: { conversation_id: '', content: 'hello' } });
  assert.ok(emptyConversationError);
  assert.equal(emptyConversationError.statusCode, 400);

  const emptyContentError = await capture(validateSendMessage, { body: { conversation_id: 'conversation-1', content: '   ' } });
  assert.ok(emptyContentError);
  assert.equal(emptyContentError.statusCode, 400);

  const valid = await capture(validateUpdateMessage, { body: { content: 'updated text' } });
  assert.equal(valid, undefined);
});
