/**
 * services/auth.service.js — Authentication Business Logic
 * Pocket C.A. Backend
 *
 * Handles user registration, credentials verification, JWT issuance,
 * and user profile retrieval.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Helper: Generate JWT token for user
 * @param {string} userId - User ObjectId string
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, currency }
 * @returns {Promise<Object>} { user, token }
 */
const registerUser = async ({ name, email, password, currency }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists.', 'DUPLICATE_EMAIL');
  }

  // Create new user (pre-save hook will hash passwordHash)
  const newUser = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: password,
    currency: currency || 'INR',
  });

  // Convert to object and strip sensitive fields
  const userObj = newUser.toObject();
  delete userObj.passwordHash;

  const token = generateToken(newUser._id);

  return { user: userObj, token };
};

/**
 * Login existing user
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { user, token }
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email and explicitly select passwordHash
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email address or password.', 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email address or password.', 'INVALID_CREDENTIALS');
  }

  // Strip passwordHash before returning
  const userObj = user.toObject();
  delete userObj.passwordHash;

  const token = generateToken(user._id);

  return { user: userObj, token };
};

/**
 * Get current user profile by ID
 * @param {string} userId - User ObjectId string
 * @returns {Promise<Object>} User document without sensitive fields
 */
const getMe = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    throw new ApiError(404, 'User profile not found.', 'USER_NOT_FOUND');
  }
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  generateToken,
};
