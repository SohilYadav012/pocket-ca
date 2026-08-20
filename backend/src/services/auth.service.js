/**
 * services/auth.service.js — Auth Service (MOCK)
 * Pocket C.A. Backend
 */

const registerUser = async (userData) => {
  return { user: { _id: 'mock_user_123', name: userData.name, email: userData.email }, token: 'mock_token' };
};

const loginUser = async (email, password) => {
  return { user: { _id: 'mock_user_123', name: 'Guest User', email }, token: 'mock_token' };
};

module.exports = {
  registerUser,
  loginUser,
};
