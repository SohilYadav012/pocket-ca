/**
 * services/insightService.js — Financial Insights Frontend API Client
 * Pocket C.A. Frontend
 *
 * Handles HTTP requests to /api/insights to retrieve health scores and AI suggestions.
 */

import api from './api';

const insightService = {
  /**
   * Get comprehensive financial health score, budget/goal progress, and AI recommendations
   */
  getInsights: async () => {
    const response = await api.get('/insights');
    return response.data;
  },
};

export default insightService;
