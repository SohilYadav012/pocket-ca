/**
 * pages/NotFoundPage.jsx — 404 Not Found
 * Pocket C.A. Frontend
 *
 * Shown when a route doesn't match any defined paths.
 */

import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import ROUTES from '../constants/routes';

const NotFoundPage = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="flex flex-col items-center text-center gap-5 animate-fade-in">
        {/* 404 Visual */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)' }}
        >
          <AlertCircle size={40} style={{ color: 'var(--color-danger)' }} />
        </div>

        {/* Error Code */}
        <div>
          <h1
            className="text-7xl font-black gradient-text"
            aria-label="Error 404"
          >
            404
          </h1>
          <h2 className="text-xl font-semibold mt-2" style={{ color: 'var(--color-text-primary)' }}>
            Page Not Found
          </h2>
          <p className="text-sm mt-2 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Back Home */}
        <Link
          to={ROUTES.DASHBOARD}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: '#fff',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Home size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
