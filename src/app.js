const express = require('express');
const cors = require('cors');
const authMiddleware = require('./common/middlewares/auth');
const { errorHandler } = require('./common/errors/errorHandler');
const conversationRoutes = require('./modules/chat/routes/conversation.routes');
const messageRoutes = require('./modules/chat/routes/message.routes');
const { CORS_ORIGIN } = require('./config/env');
const swaggerUi = require('swagger-ui-express');
const openApiDocument = require('../docs/openapi.json');

const app = express();

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat service is healthy',
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get('/api-docs.json', (req, res) => res.json(openApiDocument));

app.use(authMiddleware);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
});

app.use(errorHandler);

module.exports = app;
