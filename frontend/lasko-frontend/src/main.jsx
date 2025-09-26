// frontend/lasko-frontend/src/main.jsx - NAPRAWIONY Z AuthProvider I DEBUGOWANIEM
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import AuthDebug from './utils/authDebug.js';
import './index.css';

// ============================================================================
// INFORMACJE O ŚRODOWISKU I KONFIGURACJI
// ============================================================================
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

console.log('%c🚀 LASKO FRONTEND - INICJALIZACJA', 'color: #4A90E2; font-weight: bold; font-size: 16px;');
console.log('='.repeat(60));
console.log('🔍 Środowisko:', import.meta.env.MODE);
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🛠️ Development Mode:', isDevelopment);
console.log('📅 Timestamp:', new Date().toLocaleString('pl-PL'));
console.log('='.repeat(60));

// ============================================================================
// DEBUG PANEL W TRYBIE DEVELOPMENT
// ============================================================================
if (isDevelopment) {
  // Dodaj debug panel na dół strony
  const createDebugPanel = () => {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'auth-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%);
      color: white;
      padding: 8px 16px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      border-top: 2px solid #4A90E2;
      z-index: 10000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
    `;

    const updateDebugPanel = () => {
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user_data');
      const isAuth = token && user;

      let tokenStatus = '❌';
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          tokenStatus = isExpired ? '⚠️' : '✅';
        } catch (e) {
          tokenStatus = '❌';
        }
      }

      debugPanel.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: center;">
          <span style="font-weight: bold; color: #4A90E2;">🔧 DEBUG MODE</span>
          <span>Krok: <span style="color: ${isAuth ? '#7ED321' : '#D0021B'}">${getCurrentStep()}</span></span>
          <span>Autoryzacja: <span style="color: ${isAuth ? '#7ED321' : '#D0021B'};">${isAuth ? '✅' : '❌'}</span></span>
          <span>Token: ${tokenStatus}</span>
          <span>Użytkownik: ${user ? '✅' : '❌'}</span>
          <span>Błędy: <span id="error-count">0</span></span>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="window.AuthDebug.fullDiagnostic()" 
                  style="background: #4A90E2; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
            🔍 Diagnostyka
          </button>
          <button onclick="window.AuthDebug.clearAuth()" 
                  style="background: #D0021B; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
            🗑️ Wyczyść
          </button>
          <button onclick="document.getElementById('auth-debug-panel').remove()" 
                  style="background: #666; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
            ✕
          </button>
        </div>
      `;
    };

    const getCurrentStep = () => {
      const path = window.location.pathname;
      if (path.includes('/register')) return '5/5';
      if (path.includes('/login')) return '0/5';
      if (path.includes('/dashboard')) return 'Dashboard';
      return 'Nieznany';
    };

    // Dodaj panel do strony
    document.body.appendChild(debugPanel);

    // Aktualizuj co sekundę
    updateDebugPanel();
    setInterval(updateDebugPanel, 1000);

    // Aktualizuj przy zmianach w localStorage
    window.addEventListener('storage', updateDebugPanel);

    console.log('🔧 Debug panel dodany do strony');
  };

  // Utwórz panel po załadowaniu DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createDebugPanel);
  } else {
    createDebugPanel();
  }

  // Dodaj globalne funkcje debugowania
  window.debugAuth = () => {
    console.log('🔧 Uruchamianie pełnej diagnostyki...');
    AuthDebug.fullDiagnostic();
  };

  window.clearAuth = () => {
    console.log('🗑️ Czyszczenie autoryzacji...');
    AuthDebug.clearAuth();
    setTimeout(() => window.location.reload(), 1000);
  };

  // Automatyczna diagnostyka przy błędach 401
  const originalFetch = window.fetch;
  let errorCount = 0;

  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        errorCount++;
        const errorElement = document.getElementById('error-count');
        if (errorElement) {
          errorElement.textContent = errorCount;
          errorElement.style.color = '#D0021B';
        }
        console.warn('🚨 Wykryto błąd 401 - problemy z autoryzacją!');
        console.warn('💡 Użyj window.debugAuth() aby zdiagnozować problem');
      }
      
      return response;
    } catch (error) {
      errorCount++;
      const errorElement = document.getElementById('error-count');
      if (errorElement) {
        errorElement.textContent = errorCount;
        errorElement.style.color = '#D0021B';
      }
      throw error;
    }
  };

  console.log('🔧 Development tools załadowane:');
  console.log('   • window.debugAuth() - pełna diagnostyka');
  console.log('   • window.clearAuth() - wyczyść autoryzację');  
  console.log('   • window.AuthDebug - kompletne narzędzia debug');
  console.log('   • Debug panel na dole strony');
}

// ============================================================================
// INICJALIZACJA DIAGNOSTYKI
// ============================================================================
if (isDevelopment) {
  // Uruchom szybką diagnostykę przy starcie
  setTimeout(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user_data');
    
    console.log('%c🔍 SZYBKA DIAGNOSTYKA STARTU:', 'color: #F5A623; font-weight: bold;');
    console.log('Token:', token ? '✅ OBECNY' : '❌ BRAK');
    console.log('User:', user ? '✅ OBECNY' : '❌ BRAK');
    
    if (token && !user) {
      console.warn('⚠️ UWAGA: Masz token ale brak danych użytkownika - możliwy problem!');
      console.warn('💡 Uruchom: AuthDebug.fullDiagnostic() aby zdiagnozować');
    }
  }, 1000);
}

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

// ============================================================================
// EKSPORT INFORMACJI O BUILD
// ============================================================================
if (isDevelopment) {
  console.log('%c✅ LASKO FRONTEND GOTOWY', 'color: #7ED321; font-weight: bold; font-size: 14px;');
  console.log('🎯 Aplikacja załadowana i gotowa do użycia');
  console.log('🔧 Narzędzia deweloperskie aktywne');
  console.log('=' .repeat(60));
}