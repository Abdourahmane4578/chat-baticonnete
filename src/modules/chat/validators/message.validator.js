const AppError = require('../../../common/errors/AppError');

function validateSendMessage(req, res, next) {
  const { conversation_id, content } = req.body || {};

  if (!conversation_id) {
    return next(new AppError('conversation_id is required', 400));
  }

  if (typeof content !== 'string' || !content.trim()) {
    return next(new AppError('content is required', 400));
  }

  next();
}

function validateUpdateMessage(req, res, next) {
  const { content } = req.body || {};

  if (typeof content !== 'string' || !content.trim()) {
    return next(new AppError('content is required', 400));
  }

  next();
}

module.exports = {
  validateSendMessage,
  validateUpdateMessage,
};
