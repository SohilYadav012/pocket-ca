/**
 * pages/TransactionsPage.jsx — Full Transaction Management Page
 * Pocket C.A. Frontend
 *
 * Features:
 * - Transaction table/cards with all fields
 * - Add / Edit modal (TransactionForm)
 * - Delete confirmation dialog
 * - Search bar (debounced)
 * - Filter by type, category, payment method, date range
 * - Sort by date / amount
 * - Pagination
 * - Loading skeleton, empty state, and error state
 */

import { useEffect, useState } from 'react';
import {
  Plus, Search, SlidersHorizontal, X, ArrowUpDown,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  RefreshCw, ArrowUp, ArrowDown,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import useTransactions from '../hooks/useTransactions';
import TransactionForm from '../components/transactions/TransactionForm';
import DeleteConfirmDialog from '../components/common/DeleteConfirmDialog';
import CategoryBadge from '../components/common/CategoryBadge';
import { CATEGORIES, PAYMENT_METHODS } from '../constants/categories';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';

// ─── Payment method label map ─────────────────────────────────────────────────
const PM_LABEL = { cash: 'Cash', upi: 'UPI', card: 'Card', bank_transfer: 'Bank Transfer', other: 'Other' };

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="px-4 py-3.5">
        <div className="skeleton h-4 rounded" style={{ width: `${[60, 80, 50, 70, 60, 40][i - 1]}%` }} />
      </td>
    ))}
  </tr>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ hasFilters, onReset, onAdd }) => (
  <tr>
    <td colSpan={6}>
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
          <ArrowUpDown size={28} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="text-center">
          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {hasFilters ? 'No matching transactions' : 'No transactions yet'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {hasFilters ? 'Try adjusting your filters or search.' : 'Add your first transaction to get started.'}
          </p>
        </div>
        {hasFilters ? (
          <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-secondary)' }}>
            <X size={14} /> Clear Filters
          </button>
        ) : (
          <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: '#fff' }}>
            <Plus size={14} /> Add Transaction
          </button>
        )}
      </div>
    </td>
  </tr>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const TransactionsPage = () => {
  const {
    transactions, pagination, filters, isLoading, isSubmitting, error,
    fetchTransactions, applyFilter, handleSearch, goToPage, resetFilters,
    createTransaction, updateTransaction, deleteTransaction,
  } = useTransactions();

  // Modal state
  const [showForm, setShowForm]   = useState(false);
  const [editData, setEditData]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Fetch on mount
  useEffect(() => { fetchTransactions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openAdd  = () => { setEditData(null); setShowForm(true); };
  const openEdit = (tx) => { setEditData(tx); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditData(null); };

  const handleFormSubmit = async (data) => {
    if (editData) return updateTransaction(editData._id, data);
    return createTransaction(data);
  };

  const handleSearchChange = (val) => {
    setSearchInput(val);
    handleSearch(val);
  };

  const handleSort = (field) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    const updated = { ...filters, sortBy: field, sortOrder: newOrder, page: 1 };
    applyFilter('sortBy', field);
    applyFilter('sortOrder', newOrder);
    fetchTransactions(updated);
  };

  const hasFilters = filters.type || filters.category || filters.paymentMethod ||
                     filters.startDate || filters.endDate || filters.search;

  const SortIcon = ({ field }) => {
    if (filters.sortBy !== field) return <ArrowUpDown size={13} style={{ opacity: 0.4 }} />;
    return filters.sortOrder === 'asc'
      ? <ArrowUp size={13} style={{ color: 'var(--color-primary)' }} />
      : <ArrowDown size={13} style={{ color: 'var(--color-primary)' }} />;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-bg-border)' },
      }} />

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Transactions
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {pagination.total > 0
              ? `${pagination.total} transaction${pagination.total !== 1 ? 's' : ''} total`
              : 'Track your income and expenses'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchTransactions()} title="Refresh"
            className="p-2.5 rounded-xl transition-colors"
            style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', color: '#fff', boxShadow: 'var(--shadow-glow)' }}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by description or category..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }}
            />
            {searchInput && (
              <button onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>
          {/* Toggle Filters */}
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: (showFilters || hasFilters) ? 'rgba(99,102,241,0.15)' : 'var(--color-bg-hover)',
              border: (showFilters || hasFilters) ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--color-bg-border)',
              color: (showFilters || hasFilters) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}>
            <SlidersHorizontal size={15} />
            Filters {hasFilters ? '●' : ''}
          </button>
          {hasFilters && (
            <button onClick={() => { resetFilters(); setSearchInput(''); }}
              className="px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-muted)' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Filter Panel ──────────────────────────────────────────────── */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 animate-fade-in">
            {/* Type */}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Type</label>
              <select value={filters.type} onChange={(e) => applyFilter('type', e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }}>
                <option value="">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            {/* Category */}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Category</label>
              <select value={filters.category} onChange={(e) => applyFilter('category', e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }}>
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            {/* Payment Method */}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Payment</label>
              <select value={filters.paymentMethod} onChange={(e) => applyFilter('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }}>
                <option value="">All Methods</option>
                {PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            {/* Start Date */}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>From Date</label>
              <input type="date" value={filters.startDate} onChange={(e) => applyFilter('startDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }} />
            </div>
            {/* End Date */}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>To Date</label>
              <input type="date" value={filters.endDate} min={filters.startDate}
                onChange={(e) => applyFilter('endDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-bg-border)', color: 'var(--color-text-primary)' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)' }}>
          {error}
          <button onClick={() => fetchTransactions()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* ── Transactions Table ──────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-bg-border)' }}>
                {[
                  { label: 'Date', field: 'transactionDate', sortable: true },
                  { label: 'Description', field: null, sortable: false },
                  { label: 'Category', field: 'category', sortable: false },
                  { label: 'Payment', field: null, sortable: false },
                  { label: 'Amount', field: 'amount', sortable: true },
                  { label: 'Actions', field: null, sortable: false },
                ].map(({ label, field, sortable }) => (
                  <th key={label}
                    className={`px-4 py-3.5 text-left text-xs font-semibold tracking-wide ${sortable ? 'cursor-pointer select-none' : ''}`}
                    style={{ color: 'var(--color-text-muted)' }}
                    onClick={sortable ? () => handleSort(field) : undefined}>
                    <span className="flex items-center gap-1.5">
                      {label}
                      {sortable && <SortIcon field={field} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : transactions.length === 0
                  ? <EmptyState hasFilters={!!hasFilters} onReset={() => { resetFilters(); setSearchInput(''); }} onAdd={openAdd} />
                  : transactions.map((tx) => (
                    <tr key={tx._id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--color-bg-border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                          {formatDate(tx.transactionDate, 'day-month')}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <p className="truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {tx.description || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No description</span>}
                        </p>
                        {tx.tags?.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {tx.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-muted)' }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <CategoryBadge categoryId={tx.category} />
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>
                          {PM_LABEL[tx.paymentMethod] || tx.paymentMethod}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {tx.type === 'Income'
                            ? <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
                            : <TrendingDown size={14} style={{ color: 'var(--color-danger)' }} />
                          }
                          <span className="font-semibold"
                            style={{ color: tx.type === 'Income' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(tx)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(99,102,241,0.15)' }}>
                            Edit
                          </button>
                          <button onClick={() => setDeleteId(tx._id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {pagination.pages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3.5 border-t"
            style={{ borderColor: 'var(--color-bg-border)' }}>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg transition-all"
                style={{
                  color: pagination.page <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  opacity: pagination.page <= 1 ? 0.4 : 1,
                  cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                  background: 'var(--color-bg-hover)',
                }}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                const p = pagination.pages <= 7 ? i + 1 : (() => {
                  const cur = pagination.page;
                  const total = pagination.pages;
                  if (i === 0) return 1;
                  if (i === 6) return total;
                  if (cur <= 4) return i + 1;
                  if (cur >= total - 3) return total - 6 + i;
                  return cur - 3 + i;
                })();
                return (
                  <button key={p} onClick={() => goToPage(p)}
                    className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: pagination.page === p ? 'var(--color-primary)' : 'var(--color-bg-hover)',
                      color: pagination.page === p ? '#fff' : 'var(--color-text-secondary)',
                    }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-lg transition-all"
                style={{
                  color: pagination.page >= pagination.pages ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  opacity: pagination.page >= pagination.pages ? 0.4 : 1,
                  cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
                  background: 'var(--color-bg-hover)',
                }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <TransactionForm
        isOpen={showForm}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        editData={editData}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        isLoading={isSubmitting}
        onConfirm={async () => {
          const ok = await deleteTransaction(deleteId);
          if (ok) setDeleteId(null);
        }}
      />
    </div>
  );
};

export default TransactionsPage;
