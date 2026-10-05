const AppError = require('../../../common/errors/AppError');

function validateGetOrCreateConversation(req, res, next) {
  const { participant_id } = req.body || {};

  if (!participant_id) {
    return next(new AppError('participant_id is required', 400));
  }

  next();
}

module.exports = { validateGetOrCreateConversation };
