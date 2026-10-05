const { Server } = require('socket.io');
const { registerSocketHandlers } = require('./socket.handlers');

let io;

function initSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
  });

  return io;
}

module.exports = { initSocketServer, getIO: () => io };
