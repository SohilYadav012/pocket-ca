/**
 * context/ToastContext.jsx — Toast Notification Context
 * Pocket C.A. Frontend
 *
 * Provides a global mechanism to display 3D glass toasts from anywhere in the app.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';

const ToastContext = createContext({
  addToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const showSuccess = useCallback((message, duration = 4000) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const showError = useCallback((message, duration = 5000) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration = 4000) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  const value = {
    addToast,
    showSuccess,
    showError,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
