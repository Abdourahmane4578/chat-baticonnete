const http = require('http');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { initSocketServer } = require('./sockets/socket.server');
const { PORT } = require('./config/env');

async function startServer() {
  try {
    await connectDatabase();
    const server = http.createServer(app);
    initSocketServer(server);

    server.listen(PORT, () => {
      console.log(`Chat microservice listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
