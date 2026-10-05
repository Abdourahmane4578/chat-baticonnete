const onlineUsers = new Map();

function setUserOnline(userId, socketId) {
  if (!userId) return;
  const existing = onlineUsers.get(userId) || new Set();
  existing.add(socketId);
  onlineUsers.set(userId, existing);
}

function setUserOffline(userId, socketId) {
  if (!userId) return;
  const existing = onlineUsers.get(userId);
  if (!existing) return;

  existing.delete(socketId);

  if (existing.size === 0) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, existing);
  }
}

function getUserSocketIds(userId) {
  return onlineUsers.get(userId) || new Set();
}

module.exports = {
  onlineUsers,
  setUserOnline,
  setUserOffline,
  getUserSocketIds,
};
