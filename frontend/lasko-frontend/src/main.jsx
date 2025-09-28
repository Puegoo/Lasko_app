// frontend/lasko-frontend/src/main.jsx - WERSJA BEZ DEBUGÓW
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './index.css';

// ============================================================================
// INFORMACJE O ŚRODOWISKU I KONFIGURACJI
// ============================================================================
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// RENDEROWANIE APLIKACJI
// ============================================================================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);