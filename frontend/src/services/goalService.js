/**
 * services/goalService.js — Savings Goals Frontend API Client
 * Pocket C.A. Frontend
 *
 * Handles HTTP requests to /api/goals for savings goal tracking and contributions.
 */

import api from './api';

const goalService = {
  /**
   * Get user savings goals
   * @param {Object} params - { status: 'Active' | 'Completed' }
   */
  getGoals: async (params = {}) => {
    const response = await api.get('/goals', { params });
    return response.data;
  },

  /**
   * Create a new savings goal
   * @param {Object} data - { goalName, targetAmount, currentAmount, targetDate }
   */
  createGoal: async (data) => {
    const response = await api.post('/goals', data);
    return response.data;
  },

  /**
   * Update goal or add contribution
   * @param {string} id - Goal ID
   * @param {Object} data - { currentAmount, goalName, targetAmount, targetDate }
   */
  updateGoal: async (id, data) => {
    const response = await api.put(`/goals/${id}`, data);
    return response.data;
  },

  /**
   * Delete a savings goal
   * @param {string} id - Goal ID
   */
  deleteGoal: async (id) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },
};

export default goalService;
