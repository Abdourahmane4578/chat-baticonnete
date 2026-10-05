const test = require('node:test');
const assert = require('node:assert/strict');

const buildParticipantsKey = require('../../src/common/utils/participantKey');

test('buildParticipantsKey normalizes the order of two participant ids', () => {
  assert.equal(buildParticipantsKey('200', '100'), '100:200');
  assert.equal(buildParticipantsKey('100', '200'), '100:200');
});

test('buildParticipantsKey throws when a participant id is missing', () => {
  assert.throws(() => buildParticipantsKey('', '100'), /Both participant ids are required/);
  assert.throws(() => buildParticipantsKey('100', ''), /Both participant ids are required/);
});
