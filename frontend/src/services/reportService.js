/**
 * services/reportService.js — Financial Reports & Export API Service
 * Pocket C.A. Frontend
 *
 * Handles fetching aggregated report summaries and triggering browser downloads
 * for streaming PDF and Excel file exports.
 */

import api from './api';

/**
 * Fetch financial report summary metrics and category/monthly breakdown.
 * @param {Object} [params] - Optional query filters { startDate, endDate }
 */
export const getReportSummary = async (params = {}) => {
  const res = await api.get('/reports/summary', { params });
  return res.data.data;
};

/**
 * Download professional financial report as a PDF document.
 * @param {Object} [params] - Optional query filters { startDate, endDate }
 */
export const downloadPdfReport = async (params = {}) => {
  const res = await api.get('/reports/export/pdf', {
    params,
    responseType: 'blob', // Required for binary stream handling
  });

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateTag = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Pocket_CA_Financial_Report_${dateTag}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Download comprehensive financial ledger as a multi-sheet Excel spreadsheet.
 * @param {Object} [params] - Optional query filters { startDate, endDate }
 */
export const downloadExcelReport = async (params = {}) => {
  const res = await api.get('/reports/export/excel', {
    params,
    responseType: 'blob', // Required for spreadsheet stream handling
  });

  const blob = new Blob([res.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateTag = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Pocket_CA_Financial_Report_${dateTag}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
