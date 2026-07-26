/**
 * components/dashboard/CategoryBreakdownChart.jsx — Expense Donut Chart
 * Pocket C.A. Frontend
 *
 * Uses Recharts PieChart (Donut style) to display spending breakdown by category.
 * Maps category IDs to visual tokens from categories.js.
 */

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { getCategoryById } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatCurrency';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const cat = getCategoryById(data.category);

  return (
    <div
      className="p-3 rounded-xl shadow-2xl text-xs space-y-1 animate-fade-in"
      style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--color-bg-border)',
      }}
    >
      <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
        <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
        {cat.label}
      </div>
      <div className="flex justify-between gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Amount:</span>
        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(data.totalAmount)}</span>
      </div>
      <div className="flex justify-between gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Share:</span>
        <span className="font-bold" style={{ color: cat.color }}>{data.percentage}%</span>
      </div>
      <div className="flex justify-between gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Transactions:</span>
        <span className="font-medium">{data.count}</span>
      </div>
    </div>
  );
};

const CategoryBreakdownChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-card p-6 h-80 flex flex-col justify-between">
        <div className="skeleton h-5 w-40 rounded mb-4" />
        <div className="skeleton flex-1 w-full rounded-full max-w-[200px] mx-auto" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 h-80 flex flex-col items-center justify-center text-center">
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No expense categories</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Record expenses to view spending categorization.</p>
      </div>
    );
  }

  // Map backend category strings to full category UI objects with colors
  const chartData = data.map((item) => {
    const catConfig = getCategoryById(item.category);
    return {
      ...item,
      name: catConfig.label,
      color: catConfig.color,
    };
  });

  return (
    <div className="glass-card p-6 flex flex-col h-80">
      <div className="mb-2">
        <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Expense by Category
        </h2>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Distribution of total spending
        </p>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 min-h-0">
        {/* Chart */}
        <div className="w-full sm:w-3/5 h-44 sm:h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="totalAmount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                animationDuration={800}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Scrollable Legend */}
        <div className="w-full sm:w-2/5 max-h-44 overflow-y-auto space-y-2 pr-1 text-xs">
          {chartData.map((item) => (
            <div key={item.category} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="truncate font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {item.name}
                </span>
              </div>
              <span className="font-semibold flex-shrink-0" style={{ color: item.color }}>
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdownChart;
