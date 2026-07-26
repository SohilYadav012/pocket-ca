/**
 * components/layout/Navbar.jsx — Top Navigation Bar
 * Pocket C.A. Frontend
 *
 * Displays the top bar with:
 * - Hamburger menu (mobile)
 * - Page title area
 * - User avatar and logout button
 */

import { Menu, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ROUTES from '../../constants/routes';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{
        borderColor: 'var(--color-bg-border)',
        background: 'var(--color-bg-card)',
        minHeight: '64px',
      }}
    >
      {/* Left: Menu Button (mobile) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Center: Brand (visible on mobile only) */}
      <div className="lg:hidden">
        <span className="font-bold text-lg gradient-text">Pocket C.A.</span>
      </div>

      {/* Right: User Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notification Bell (placeholder) */}
        <button
          className="p-2 rounded-lg transition-colors relative"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        {/* User Avatar + Name */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              color: '#fff',
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
          </div>
          <span
            className="hidden sm:block text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {user?.name || 'User'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
