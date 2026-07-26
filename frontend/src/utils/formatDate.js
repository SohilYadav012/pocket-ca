/**
 * utils/formatDate.js — Date Formatting Utility
 * Pocket C.A. Frontend
 *
 * Utility functions for formatting dates consistently across the app.
 */

/**
 * Format a date to a readable string.
 * @param {Date|string} date - Date object or ISO string
 * @param {string} format    - 'short' | 'long' | 'month-year' | 'relative'
 * @returns {string}
 *
 * Examples:
 *   formatDate('2026-07-25', 'short')       →  '25 Jul 2026'
 *   formatDate('2026-07-25', 'long')        →  'Friday, July 25, 2026'
 *   formatDate('2026-07-25', 'month-year')  →  'July 2026'
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '—';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const options = {
    short:        { day: '2-digit', month: 'short', year: 'numeric' },
    long:         { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    'month-year': { month: 'long', year: 'numeric' },
    'day-month':  { day: '2-digit', month: 'short' },
  };

  return new Intl.DateTimeFormat('en-IN', options[format] || options.short).format(d);
};

/**
 * Get the current month in 'YYYY-MM' format.
 * @returns {string} e.g. '2026-07'
 */
export const getCurrentMonthYear = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Get start and end dates for a given month.
 * @param {string} monthYear - 'YYYY-MM'
 * @returns {{ startDate: string, endDate: string }}
 */
export const getMonthDateRange = (monthYear) => {
  const [year, month] = monthYear.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate   = new Date(year, month, 0).toISOString().split('T')[0];
  return { startDate, endDate };
};

export default formatDate;
