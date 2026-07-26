/**
 * components/layout/AppLayout.jsx — Main Application Layout
 * Pocket C.A. Frontend
 *
 * Wraps all protected pages with Sidebar + Navbar + main content area.
 * Uses React Router's <Outlet /> to render child routes.
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '1.5rem' }}
        >
          <div className="page-container animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
