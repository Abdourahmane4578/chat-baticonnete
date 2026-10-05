const AppError = require('../errors/AppError');

function attachUser(req, res, next) {
  const headerUserId = req.get('x-user-id') || req.get('X-User-Id');
  const bodyUserId = req.body && req.body.user_id;
  const queryUserId = req.query && req.query.user_id;

  const userId = headerUserId || bodyUserId || queryUserId;

  if (!userId) {
    return next(new AppError('Authenticated user id is required', 401));
  }

  req.user = { id: String(userId) };
  next();
}

module.exports = attachUser;
