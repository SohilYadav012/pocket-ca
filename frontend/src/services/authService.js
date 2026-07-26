/**
 * services/authService.js — Authentication API Client
 * Pocket C.A. Frontend
 *
 * Handles HTTP calls to /api/auth endpoints using the configured Axios instance.
 */

import api from './api';

const authService = {
  /**
   * Register a new account
   * @param {Object} userData - { name, email, password, currency }
   * @returns {Promise<Object>} { user, token }
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  },

  /**
   * Sign in to existing account
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { user, token }
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  },

  /**
   * Fetch profile of currently authenticated session
   * @returns {Promise<Object>} user profile
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
};

export default authService;
