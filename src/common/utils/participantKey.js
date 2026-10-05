function buildParticipantsKey(userA, userB) {
  const first = String(userA).trim();
  const second = String(userB).trim();

  if (!first || !second) {
    throw new Error('Both participant ids are required to build a conversation key');
  }

  return [first, second].sort().join(':');
}

module.exports = buildParticipantsKey;
