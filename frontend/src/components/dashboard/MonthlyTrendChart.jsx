/**
 * components/dashboard/MonthlyTrendChart.jsx — Income vs Expense Bar Chart
 * Pocket C.A. Frontend
 *
 * Uses Recharts to visualize monthly income and expense trends.
 * Features a dark glass tooltip, responsive sizing, and smooth bar animations.
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

// ─── Custom Dark Glass Tooltip ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="p-3.5 rounded-xl shadow-2xl space-y-1.5 text-xs animate-fade-in"
      style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--color-bg-border)',
      }}
    >
      <p className="font-bold text-sm border-b pb-1 mb-1.5" style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-bg-border)' }}>
        {label}
      </p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
            {entry.name}:
          </span>
          <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const MonthlyTrendChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-card p-6 h-80 flex flex-col justify-between">
        <div className="skeleton h-5 w-40 rounded mb-4" />
        <div className="skeleton flex-1 w-full rounded-xl" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 h-80 flex flex-col items-center justify-center text-center">
        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No monthly trend data</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Add income or expenses to generate trend analytics.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col h-80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Monthly Income vs Expense
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Comparison over recent months
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="var(--color-text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              stroke="var(--color-text-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
            />
            <Bar
              name="Income"
              dataKey="income"
              fill="var(--color-success)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
              animationDuration={800}
            />
            <Bar
              name="Expense"
              dataKey="expense"
              fill="var(--color-danger)"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyTrendChart;
