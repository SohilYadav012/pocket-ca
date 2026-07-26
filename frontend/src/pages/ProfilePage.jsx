/**
 * pages/ProfilePage.jsx — User Profile & Settings
 * Pocket C.A. Frontend
 *
 * Account settings, currency preferences, and password change. Phase 2.
 */

import { UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Profile & Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your account details and preferences
        </p>
      </div>

      {/* User Info Card */}
      <div className="glass-card p-6 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: '#fff',
          }}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle size={28} />}
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {user?.name || 'User Name'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {user?.email || 'user@example.com'}
          </p>
          <span className="badge badge-primary mt-2">
            {user?.currency || 'INR'}
          </span>
        </div>
      </div>

      <div className="glass-card p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Profile editing and password change functionality will be implemented in Phase 2.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
