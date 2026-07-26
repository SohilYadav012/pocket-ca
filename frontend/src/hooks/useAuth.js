/**
 * hooks/useAuth.js — Auth Hook Re-export
 * Pocket C.A. Frontend
 *
 * Convenience re-export of useAuth from AuthContext.
 * Supports both named and default imports:
 *   import useAuth, { useAuth } from '../hooks/useAuth'
 */

import { useAuth } from '../context/AuthContext';
export { useAuth };
export default useAuth;
