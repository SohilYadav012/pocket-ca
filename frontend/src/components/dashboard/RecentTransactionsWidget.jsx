/**
 * components/dashboard/RecentTransactionsWidget.jsx — Recent Transactions List
 * Pocket C.A. Frontend
 *
 * Displays the 5 most recent transactions with clean badges and currency formatting.
 * Provides a quick link to navigate to the full Transactions page.
 */

import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import CategoryBadge from '../common/CategoryBadge';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

const RecentTransactionsWidget = ({ transactions, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <div className="skeleton h-5 w-36 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
            <div className="flex gap-3 items-center">
              <div className="skeleton w-8 h-8 rounded-full" />
              <div>
                <div className="skeleton h-4 w-24 rounded mb-1" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            </div>
            <div className="skeleton h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Recent Transactions
          </h2>
        </div>
        <Link
          to="/transactions"
          className="text-xs font-semibold flex items-center gap-1 hover:underline transition-all"
          style={{ color: 'var(--color-primary)' }}
        >
          View All <ArrowRight size={13} />
        </Link>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No recent activity</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Your latest transactions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {transactions.map((tx) => (
            <div
              key={tx._id}
              className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/5"
              style={{ border: '1px solid var(--color-bg-border)', background: 'rgba(255, 255, 255, 0.02)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: tx.type === 'Income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: tx.type === 'Income' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  {tx.type === 'Income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {tx.description || <span className="italic text-muted">No description</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge categoryId={tx.category} size="sm" />
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(tx.transactionDate, 'short')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-3">
                <p
                  className="text-sm font-bold"
                  style={{ color: tx.type === 'Income' ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                  {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  {tx.paymentMethod}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentTransactionsWidget;
