/**
 * hooks/useLocalStorage.js — Local Storage Hook
 * Pocket C.A. Frontend
 *
 * Manages state synchronized with localStorage.
 * Works like useState but persists across page refreshes.
 */

import { useState, useEffect } from 'react';

/**
 * @param {string} key          - localStorage key
 * @param {*}      initialValue - Default value if key doesn't exist
 * @returns {[value, setValue]} - Same API as useState
 */
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`[useLocalStorage] Error setting key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

export default useLocalStorage;
