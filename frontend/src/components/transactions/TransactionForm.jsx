/**
 * components/transactions/TransactionForm.jsx — Add / Edit Transaction Modal
 * Pocket C.A. Frontend
 *
 * Full-featured modal form for creating and editing transactions.
 * Handles validation, loading states, and form reset.
 * Pre-fills all fields when editing an existing transaction.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Save, PlusCircle } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../constants/categories';

const INITIAL_FORM = {
  type: 'Expense',
  category: 'food',
  amount: '',
  description: '',
  transactionDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'upi',
  tags: '',
};

const InputField = ({ label, id, error, children }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
      {label}
    </label>
    {children}
    {error && <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
  </div>
);

const inputStyle = {
  background: 'var(--color-bg-hover)',
  border: '1px solid var(--color-bg-border)',
  color: 'var(--color-text-primary)',
  borderRadius: '10px',
  padding: '0.6rem 0.875rem',
  width: '100%',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const TransactionForm = ({ isOpen, onClose, onSubmit, isSubmitting, editData }) => {
  const [form, setForm]     = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const isEditing = !!editData;

  // ── Populate form when editing ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setForm({
          type:            editData.type || 'Expense',
          category:        editData.category || 'food',
          amount:          editData.amount?.toString() || '',
          description:     editData.description || '',
          transactionDate: editData.transactionDate
            ? new Date(editData.transactionDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          paymentMethod:   editData.paymentMethod || 'upi',
          tags:            Array.isArray(editData.tags) ? editData.tags.join(', ') : '',
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setErrors({});
    }
  }, [isOpen, editData]);

  // ── Update field ──────────────────────────────────────────────────────────
  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-reset category when type switches to avoid mismatched category
      if (key === 'type') {
        const validCats = value === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        if (!validCats.find((c) => c.id === prev.category)) {
          next.category = validCats[0].id;
        }
      }
      return next;
    });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  // ── Client-side validation ────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.type)             errs.type = 'Type is required';
    if (!form.category)         errs.category = 'Category is required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = 'Enter a valid positive amount';
    if (!form.transactionDate)  errs.transactionDate = 'Date is required';
    if (new Date(form.transactionDate) > new Date()) errs.transactionDate = 'Date cannot be in the future';
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      type:            form.type,
      category:        form.category,
      amount:          parseFloat(Number(form.amount).toFixed(2)),
      description:     form.description.trim(),
      transactionDate: form.transactionDate,
      paymentMethod:   form.paymentMethod,
      tags:            form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    const ok = await onSubmit(payload);
    if (ok) onClose();
  };

  if (!isOpen) return null;

  const availableCategories = form.type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl animate-fade-in flex flex-col my-auto"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-bg-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          maxHeight: 'calc(100vh - 2.5rem)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-bg-border)', background: 'var(--color-bg-card)', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: isEditing ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)' }}
            >
              {isEditing
                ? <Save size={17} style={{ color: 'var(--color-primary)' }} />
                : <PlusCircle size={17} style={{ color: 'var(--color-success)' }} />
              }
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {isEditing ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Form Body (Scrollable) ───────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {/* Type Toggle */}
            <InputField label="Transaction Type" id="type" error={errors.type}>
              <div className="flex gap-2">
                {['Income', 'Expense'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: form.type === t
                        ? (t === 'Income' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)')
                        : 'var(--color-bg-hover)',
                      color: form.type === t
                        ? (t === 'Income' ? 'var(--color-success)' : 'var(--color-danger)')
                        : 'var(--color-text-secondary)',
                      border: form.type === t
                        ? `1px solid ${t === 'Income' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                        : '1px solid var(--color-bg-border)',
                    }}
                  >
                    {t === 'Income' ? '↑ Income' : '↓ Expense'}
                  </button>
                ))}
              </div>
            </InputField>

            {/* Amount */}
            <InputField label="Amount (₹)" id="amount" error={errors.amount}>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '2.25rem' }}
                />
              </div>
            </InputField>

            {/* Category */}
            <InputField label="Category" id="category" error={errors.category}>
              <select
                id="category"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">{c.label}</option>
                ))}
              </select>
            </InputField>

            {/* Date */}
            <InputField label="Transaction Date" id="transactionDate" error={errors.transactionDate}>
              <input
                id="transactionDate"
                type="date"
                value={form.transactionDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('transactionDate', e.target.value)}
                style={inputStyle}
              />
            </InputField>

            {/* Payment Method */}
            <InputField label="Payment Method" id="paymentMethod" error={errors.paymentMethod}>
              <select
                id="paymentMethod"
                value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">{m.label}</option>
                ))}
              </select>
            </InputField>

            {/* Description */}
            <InputField label="Description (optional)" id="description">
              <input
                id="description"
                type="text"
                placeholder="e.g. Lunch at restaurant"
                maxLength={500}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                style={inputStyle}
              />
            </InputField>

            {/* Tags */}
            <InputField label="Tags (optional, comma-separated)" id="tags">
              <input
                id="tags"
                type="text"
                placeholder="e.g. work, personal, travel"
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                style={inputStyle}
              />
            </InputField>
          </div>

          {/* ── Footer (Fixed at bottom of modal card) ───────────────────── */}
          <div
            className="flex gap-3 px-6 py-4 border-t shrink-0"
            style={{ borderColor: 'var(--color-bg-border)', background: 'var(--color-bg-card)', borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
              style={{
                background: 'var(--color-bg-hover)',
                border: '1px solid var(--color-bg-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                color: '#fff',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                : <>{isEditing ? <Save size={15} /> : <PlusCircle size={15} />} {isEditing ? 'Update' : 'Add Transaction'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default TransactionForm;
