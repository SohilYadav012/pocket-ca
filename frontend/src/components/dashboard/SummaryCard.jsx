/**
 * components/dashboard/SummaryCard.jsx — Stat Metric Card
 * Pocket C.A. Frontend
 *
 * Displays a core dashboard metric (Balance, Income, Expense, Transactions)
 * with glassmorphism styling, glowing icon badge, and optional trend/subtext.
 */

const SummaryCard = ({ title, value, subtext, icon: Icon, color, isNegative = false }) => {
  return (
    <div
      className="glass-card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        border: `1px solid ${color}25`,
        background: `linear-gradient(135deg, var(--color-bg-card), ${color}08)`,
        boxShadow: `0 8px 32px -4px ${color}15`,
      }}
    >
      {/* Background Glow Blob */}
      <div
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>
            {title}
          </p>
          <h3
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: isNegative ? 'var(--color-danger)' : 'var(--color-text-primary)' }}
          >
            {value}
          </h3>
          {subtext && (
            <p className="text-xs mt-1.5 font-medium flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              {subtext}
            </p>
          )}
        </div>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}30`,
            boxShadow: `0 0 16px ${color}20`,
          }}
        >
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
