/**
 * utils/formatCurrency.js — Currency Formatting Utility
 * Pocket C.A. Frontend
 *
 * Formats a number as a localized currency string.
 *
 * Usage:
 *   formatCurrency(1500, 'INR')  →  '₹1,500.00'
 *   formatCurrency(1500, 'USD')  →  '$1,500.00'
 */

/**
 * Format a number as a currency string.
 * @param {number} amount   - The numeric amount
 * @param {string} currency - ISO 4217 currency code (default: 'INR')
 * @param {string} locale   - BCP 47 locale string (default: 'en-IN')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a number as a compact currency string (e.g., ₹1.5L, ₹2.3Cr)
 * @param {number} amount   - The numeric amount
 * @param {string} currency - ISO 4217 currency code (default: 'INR')
 * @returns {string} Compact formatted string
 */
export const formatCurrencyCompact = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const symbol = currency === 'INR' ? '₹' : '$';

  if (absAmount >= 10000000) return `${sign}${symbol}${(absAmount / 10000000).toFixed(2)}Cr`;
  if (absAmount >= 100000)   return `${sign}${symbol}${(absAmount / 100000).toFixed(2)}L`;
  if (absAmount >= 1000)     return `${sign}${symbol}${(absAmount / 1000).toFixed(1)}K`;
  return `${sign}${symbol}${absAmount.toFixed(2)}`;
};

export default formatCurrency;
