/**
 * services/budgetService.js — Budget Frontend API Client
 * Pocket C.A. Frontend
 *
 * Handles HTTP requests to /api/budgets for category budget management.
 */

import api from './api';

const budgetService = {
  /**
   * Get monthly category budgets
   * @param {Object} params - { month, year }
   */
  getBudgets: async (params = {}) => {
    const response = await api.get('/budgets', { params });
    return response.data;
  },

  /**
   * Create a new category budget
   * @param {Object} data - { category, monthlyLimit, month, year }
   */
  createBudget: async (data) => {
    const response = await api.post('/budgets', data);
    return response.data;
  },

  /**
   * Update an existing budget limit or category
   * @param {string} id - Budget ID
   * @param {Object} data - { monthlyLimit, category }
   */
  updateBudget: async (id, data) => {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
  },

  /**
   * Delete a category budget
   * @param {string} id - Budget ID
   */
  deleteBudget: async (id) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};

export default budgetService;
