/**
 * components/common/Toast.jsx — 3D Glass Toast Component
 * Pocket C.A. Frontend
 *
 * Renders individual toast alerts with glassmorphic design and vibrant glow.
 */

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ id, type = 'info', message, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getStyleConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />,
          border: '1px solid rgba(52, 211, 153, 0.3)',
          glow: '0 8px 32px rgba(52, 211, 153, 0.15)',
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} className="text-rose-400 shrink-0" />,
          border: '1px solid rgba(244, 63, 94, 0.3)',
          glow: '0 8px 32px rgba(244, 63, 94, 0.15)',
        };
      case 'info':
      default:
        return {
          icon: <Info size={20} className="text-sky-400 shrink-0" />,
          border: '1px solid rgba(56, 189, 248, 0.3)',
          glow: '0 8px 32px rgba(56, 189, 248, 0.15)',
        };
    }
  };

  const config = getStyleConfig();

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl backdrop-blur-xl animate-fade-in transition-all min-w-[280px] max-w-md shadow-2xl z-50 pointer-events-auto"
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: config.border,
        boxShadow: config.glow,
      }}
    >
      {config.icon}
      <p className="text-sm font-medium flex-1" style={{ color: 'var(--color-text-primary)' }}>
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
