/**
 * utils/ApiResponse.js — Standard Response Wrapper
 * Pocket C.A. Backend
 *
 * Provides consistent JSON response formatting across all controllers.
 *
 * Usage:
 *   return ApiResponse.success(res, 200, 'Transaction created', { transaction });
 *   return ApiResponse.paginated(res, 200, 'Fetched', data, { page, limit, total });
 */

class ApiResponse {
  /**
   * Send a successful response.
   * @param {object} res         - Express response object
   * @param {number} statusCode  - HTTP status code
   * @param {string} message     - Human-readable success message
   * @param {*}      data        - Response payload
   */
  static success(res, statusCode = 200, message = 'Success', data = null) {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
  }

  /**
   * Send a paginated list response.
   * @param {object} res         - Express response object
   * @param {number} statusCode  - HTTP status code
   * @param {string} message     - Human-readable success message
   * @param {Array}  data        - Array of items
   * @param {object} pagination  - { page, limit, total, pages }
   */
  static paginated(res, statusCode = 200, message = 'Success', data = [], pagination = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        total: pagination.total || 0,
        pages: pagination.pages || Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
      },
    });
  }
}

module.exports = ApiResponse;
