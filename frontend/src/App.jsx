/**
 * App.jsx — Root Application Component
 * Pocket C.A. Frontend
 *
 * Wraps the entire app with context providers and the router.
 * Provider order matters: Auth must wrap Finance (Finance may depend on auth).
 */

import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import AppRouter from './routes';

const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <FinanceProvider>
          <AppRouter />
        </FinanceProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
