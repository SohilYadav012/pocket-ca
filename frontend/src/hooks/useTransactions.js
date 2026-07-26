/**
 * hooks/useTransactions.js — Transaction State & Operations Hook
 * Pocket C.A. Frontend
 *
 * Manages all transaction state: list, filters, pagination, loading, errors.
 * Wraps the transactionService and provides optimistic UI patterns.
 */

import { useState, useCallback, useRef } from 'react';
import * as transactionService from '../services/transactionService';
import { useFinance } from '../context/FinanceContext';
import toast from 'react-hot-toast';

const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  sortBy: 'transactionDate',
  sortOrder: 'desc',
  type: '',
  category: '',
  paymentMethod: '',
  startDate: '',
  endDate: '',
  search: '',
};

const useTransactions = () => {
  const { refreshDashboard } = useFinance();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination]     = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters]           = useState(DEFAULT_FILTERS);
  const [isLoading, setIsLoading]       = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState(null);

  // Debounce timer ref for search
  const searchTimer = useRef(null);

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async (overrideFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeFilters = { ...filters, ...overrideFilters };
      const result = await transactionService.listTransactions(activeFilters);
      setTransactions(result.data || []);
      setPagination(result.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to fetch transactions';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // ── Apply a filter change and refetch ─────────────────────────────────────
  const applyFilter = useCallback((key, value) => {
    const updated = { ...filters, [key]: value, page: 1 };
    setFilters(updated);
    fetchTransactions(updated);
  }, [filters, fetchTransactions]);

  // ── Debounced search ──────────────────────────────────────────────────────
  const handleSearch = useCallback((value) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      applyFilter('search', value);
    }, 400);
  }, [applyFilter]);

  // ── Page change ───────────────────────────────────────────────────────────
  const goToPage = useCallback((page) => {
    const updated = { ...filters, page };
    setFilters(updated);
    fetchTransactions(updated);
  }, [filters, fetchTransactions]);

  // ── Reset all filters ─────────────────────────────────────────────────────
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    fetchTransactions(DEFAULT_FILTERS);
  }, [fetchTransactions]);

  // ── Create ────────────────────────────────────────────────────────────────
  const createTransaction = useCallback(async (data) => {
    setIsSubmitting(true);
    try {
      await transactionService.createTransaction(data);
      toast.success('Transaction added successfully!');
      await fetchTransactions();
      refreshDashboard(true); // Force update dashboard cache
      return true;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create transaction';
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchTransactions, refreshDashboard]);

  // ── Update ────────────────────────────────────────────────────────────────
  const updateTransaction = useCallback(async (id, data) => {
    setIsSubmitting(true);
    try {
      const result = await transactionService.updateTransaction(id, data);
      // Optimistic update: replace in list
      setTransactions((prev) =>
        prev.map((t) => (t._id === id ? result.data.transaction : t))
      );
      toast.success('Transaction updated successfully!');
      refreshDashboard(true); // Force update dashboard cache
      return true;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update transaction';
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshDashboard]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id) => {
    setIsSubmitting(true);
    // Optimistic removal
    const prev = transactions;
    setTransactions((t) => t.filter((tx) => tx._id !== id));
    try {
      await transactionService.deleteTransaction(id);
      toast.success('Transaction deleted');
      // Refresh to update pagination totals
      await fetchTransactions();
      refreshDashboard(true); // Force update dashboard cache
      return true;
    } catch (err) {
      setTransactions(prev); // rollback
      const msg = err.response?.data?.error?.message || 'Failed to delete transaction';
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [transactions, fetchTransactions, refreshDashboard]);

  return {
    transactions,
    pagination,
    filters,
    isLoading,
    isSubmitting,
    error,
    fetchTransactions,
    applyFilter,
    handleSearch,
    goToPage,
    resetFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};

export default useTransactions;
