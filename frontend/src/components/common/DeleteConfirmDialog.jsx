/**
 * components/common/DeleteConfirmDialog.jsx — Deletion Confirmation Modal
 * Pocket C.A. Frontend
 *
 * Modal dialog asking the user to confirm before deleting a transaction.
 * Displays a destructive warning and requires explicit click to proceed.
 */

import { createPortal } from 'react-dom';
import { Trash2, X, AlertTriangle } from 'lucide-react';

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, isLoading, title, message }) => {
  if (!isOpen) return null;

  return createPortal(
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Dialog Panel */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-fade-in my-auto"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-bg-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.12)' }}
          >
            <AlertTriangle size={22} style={{ color: 'var(--color-danger)' }} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {title || 'Delete Transaction'}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          {message || 'Are you sure you want to delete this transaction? This action cannot be undone.'}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'var(--color-bg-hover)',
              border: '1px solid var(--color-bg-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: isLoading ? 'rgba(239,68,68,0.4)' : 'var(--color-danger)',
              color: '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmDialog;
