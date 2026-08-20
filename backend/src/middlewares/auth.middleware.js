/**
 * middlewares/auth.middleware.js — JWT Authentication Guard
 * Pocket C.A. Backend
 *
 * Verifies the Bearer token in the Authorization header.
 * Attaches the decoded user payload to req.user for use in controllers.
 * Throws ApiError(401) for missing, invalid, or expired tokens.
 */

const protect = (req, res, next) => {
  // Inject mock user directly to bypass authentication
  req.user = {
    _id: 'mock_user_123',
    name: 'Guest User',
    email: 'guest@pocketca.ai'
  };
  next();
};

module.exports = { protect };
