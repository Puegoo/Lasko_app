// frontend/lasko-frontend/src/main.jsx - NAPRAWIONY Z AuthProvider
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx'; // ✅ DODANE: Import AuthProvider
import './index.css';

// Debug informacje o środowisku
console.log('🚀 [App] Inicjalizacja aplikacji Lasko Frontend');
console.log('🔍 [App] Środowisko:', import.meta.env.MODE);
console.log('🔍 [App] API Base URL:', import.meta.env.VITE_API_BASE_URL || 'domyślny localhost:8000');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* ✅ DODANE: Opakowanie w AuthProvider */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);