const messageService = require('../modules/chat/services/message.service');
const { setUserOnline, setUserOffline, getUserSocketIds } = require('./socket.presence');

function registerSocketHandlers(io, socket) {
  const userId = socket.handshake.auth?.user_id || socket.handshake.query?.user_id;

  if (userId) {
    setUserOnline(userId, socket.id);
    io.emit('presence:update', { user_id: userId, online: true, last_seen: new Date() });
  }

  socket.on('join_conversation', ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(conversationId);
    socket.emit('conversation:joined', { conversationId });
  });

  socket.on('leave_conversation', ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(conversationId);
  });

  socket.on('typing', ({ conversationId, isTyping }) => {
    if (!conversationId || !userId) return;
    socket.to(conversationId).emit('typing', {
      conversationId,
      user_id: userId,
      isTyping,
    });
  });

  socket.on('send_message', async (payload, callback) => {
    try {
      const message = await messageService.sendMessage({
        senderId: userId,
        conversationId: payload.conversationId,
        content: payload.content,
        replyTo: payload.replyTo || null,
      });

      io.to(payload.conversationId).emit('message:new', message);
      if (typeof callback === 'function') {
        callback({ success: true, data: message });
      }
    } catch (error) {
      if (typeof callback === 'function') {
        callback({ success: false, message: error.message });
      }
    }
  });

  socket.on('message_delivered', async ({ messageId }, callback) => {
    if (!messageId || !userId) {
      if (typeof callback === 'function') callback({ success: false, message: 'Bad request' });
      return;
    }

    try {
      const updatedMessage = await messageService.markMessageDelivered({ messageId, userId });
      const roomId = updatedMessage?.conversation?.toString?.() || null;
      if (roomId) {
        io.to(roomId).emit('message:status', {
          messageId,
          status: 'delivered',
          user_id: userId,
        });
      }
      if (typeof callback === 'function') callback({ success: true, data: updatedMessage });
    } catch (error) {
      if (typeof callback === 'function') callback({ success: false, message: error.message });
    }
  });

  socket.on('message_read', async ({ messageId }, callback) => {
    if (!messageId || !userId) {
      if (typeof callback === 'function') callback({ success: false, message: 'Bad request' });
      return;
    }

    try {
      const updatedMessage = await messageService.markMessageRead({ messageId, userId });
      const roomId = updatedMessage?.conversation?.toString?.() || null;
      if (roomId) {
        io.to(roomId).emit('message:status', {
          messageId,
          status: 'read',
          user_id: userId,
        });
      }
      if (typeof callback === 'function') callback({ success: true, data: updatedMessage });
    } catch (error) {
      if (typeof callback === 'function') callback({ success: false, message: error.message });
    }
  });

  socket.on('disconnect', () => {
    if (!userId) return;
    setUserOffline(userId, socket.id);
    io.emit('presence:update', {
      user_id: userId,
      online: false,
      last_seen: new Date(),
    });
  });

  socket.emit('presence:connected', {
    user_id: userId,
    online: true,
    connected_socket_ids: [...getUserSocketIds(userId)],
  });
}

module.exports = { registerSocketHandlers };
