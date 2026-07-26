/**
 * controllers/auth.controller.js — Authentication Controllers
 * Pocket C.A. Backend
 *
 * Handles HTTP requests for user registration, login, and fetching current session profile.
 */

const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/auth/register — Register new account
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  return ApiResponse.success(res, 201, 'User registered successfully', result);
});

/**
 * POST /api/auth/login — Sign in existing account
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  return ApiResponse.success(res, 200, 'Login successful', result);
});

/**
 * GET /api/auth/me — Get authenticated user profile
 */
const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user._id);
  return ApiResponse.success(res, 200, 'User profile retrieved successfully', result);
});

module.exports = {
  register,
  login,
  getMe,
};
