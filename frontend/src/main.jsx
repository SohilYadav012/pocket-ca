/**
 * main.jsx — Application Entry Point
 * Pocket C.A. Frontend
 *
 * Mounts the React app into the DOM and imports global styles.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
