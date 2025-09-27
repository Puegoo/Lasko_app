// frontend/lasko-frontend/src/contexts/AuthContext.jsx - NAPRAWIONY IMPORT
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  setTokens, 
  getAccessToken, 
  getUserData, 
  clearTokens, 
  isAuthenticated as checkAuth,
  debugAuth 
} from '../services/authService';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musi być używane wewnątrz AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ============================================================================
  // POMOCNICZA FUNKCJA - ZAPISZ DANE UŻYTKOWNIKA
  // ============================================================================
  const setUserData = (payload) => {
      // Złap tokeny zarówno z payload.tokens jak i płasko (compat)
      const tokensObj = payload?.tokens || {
        access:  payload?.access  ?? payload?.access_token,
        refresh: payload?.refresh ?? payload?.refresh_token,
      };
      if (tokensObj?.access || tokensObj?.refresh) {
        setTokens({ ...tokensObj, user: payload?.user });
      }
      // Zapisz usera, jeśli jest
      const maybeUser = payload?.user || (payload?.username ? payload : null);
      if (maybeUser && (maybeUser.username || maybeUser.email || maybeUser.id)) {
        setUser(maybeUser);
        localStorage.setItem('user_data', JSON.stringify(maybeUser));
      }
    };

  // ============================================================================
  // INICJALIZACJA
  // ============================================================================
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🚀 [AuthContext] Inicjalizacja autoryzacji...');
      
      if (checkAuth()) {
        const userData = getUserData();
        setUser(userData);
        console.log('✅ [AuthContext] Użytkownik zalogowany:', userData?.username);
        
        // Opcjonalnie: odśwież profil
        try {
          await fetchUserProfile();
        } catch (error) {
          console.warn('⚠️ [AuthContext] Nie udało się pobrać profilu:', error.message);
        }
      } else {
        console.log('❌ [AuthContext] Użytkownik nie jest zalogowany');
      }
    } catch (error) {
      console.error('❌ [AuthContext] Błąd inicjalizacji:', error);
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // REJESTRACJA
  // ============================================================================
  const register = async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('📝 [AuthContext] Rejestracja użytkownika:', userData.username);
      
      const res = await apiService.register(userData);
      setUserData(res); // zapisze tokeny i usera (jeśli są w odpowiedzi)
      // szybka walidacja sesji
      if (!checkAuth()) throw new Error('Nie udało się ustawić sesji po rejestracji');
      // (opcjonalnie) odśwież profil, żeby od razu mieć aktualny stan
      try { await fetchUserProfile(); } catch {}
      console.log('✅ [AuthContext] Rejestracja pomyślna:', res?.user?.username);
      return res;

    } catch (error) {
      console.error('❌ [AuthContext] Błąd rejestracji:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // LOGOWANIE
  // ============================================================================
  const login = async (credentials) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('🔐 [AuthContext] Logowanie użytkownika:', credentials.username || credentials.login);
      
      const res = await apiService.login(credentials);
      setUserData(res);
      console.log('✅ [AuthContext] Logowanie pomyślne:', res?.user?.username);
      return res;

    } catch (error) {
      console.error('❌ [AuthContext] Błąd logowania:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // WYLOGOWANIE
  // ============================================================================
  const logout = async () => {
    try {
      console.log('👋 [AuthContext] Wylogowywanie...');
      
      try {
        await apiService.logout();
        console.log('✅ [AuthContext] Logout endpoint wywołany');
      } catch (error) {
        console.warn('⚠️ [AuthContext] Błąd logout endpoint (ignorujemy):', error.message);
      }
      
    } catch (error) {
      console.error('❌ [AuthContext] Błąd wylogowania:', error);
    } finally {
      clearTokens();
      setUser(null);
      setAuthError(null);
      console.log('✅ [AuthContext] Wylogowanie zakończone');
    }
  };

  // ============================================================================
  // POBIERANIE PROFILU
  // ============================================================================
  const fetchUserProfile = async () => {
    try {
      console.log('👤 [AuthContext] Pobieranie profilu użytkownika...');
      
      const res = await apiService.fetchUserProfile();
      // backend zwykle zwraca { user, profile }. Zapisujemy user tylko, gdy jest.
      if (res?.user) setUserData(res);
      console.log('✅ [AuthContext] Profil załadowany.');
      return res;

    } catch (error) {
      console.error('❌ [AuthContext] Błąd pobierania profilu:', error);
      
      if (error.message.includes('autoryzacji') || error.message.includes('401')) {
        await logout();
      }
      
      throw error;
    }
  };

  // ============================================================================
  // GENEROWANIE REKOMENDACJI
  // ============================================================================
  const generateRecommendations = async (method = 'hybrid', preferences = {}) => {
    try {
      console.log('🤖 [AuthContext] Generowanie rekomendacji:', { method, preferences });

      const response = await apiService.generateRecommendations(method, preferences);
      
      console.log('✅ [AuthContext] Rekomendacje wygenerowane:', response);
      return response;
      
    } catch (error) {
      console.error('❌ [AuthContext] Błąd generowania rekomendacji:', error);
      
      if (error.message.includes('autoryzacji') || error.message.includes('401')) {
        await logout();
      }
      
      throw error;
    }
  };

  // ============================================================================
  // FUNKCJE POMOCNICZE
  // ============================================================================
  const isAuthenticated = () => {
    return checkAuth();
  };

  const getToken = () => {
    return getAccessToken();
  };

  const getCurrentUser = () => {
    return user || getUserData();
  };

  // ============================================================================
  // DEBUG W DEVELOPMENT
  // ============================================================================
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.AuthContext = {
        user,
        isAuthenticated: isAuthenticated(),
        debugAuth: () => {
          console.log('🔍 [AuthContext] Stan AuthContext:');
          console.log('User:', user);
          console.log('Loading:', loading);
          console.log('Error:', authError);
          console.log('Is Authenticated:', isAuthenticated());
          console.log('Token:', getToken() ? 'Present' : 'Missing');
          debugAuth();
        },
        logout,
        generateRecommendations
      };
    }
  }, [user]);

  // ============================================================================
  // PROVIDER VALUE
  // ============================================================================
  const value = {
    user,
    loading,
    authError,
    
    // Metody autoryzacji
    register,
    login,
    logout,
    
    // Funkcje sprawdzające
    isAuthenticated,
    getToken,
    getCurrentUser,
    
    // Funkcje API
    generateRecommendations,
    fetchUserProfile,
    
    // Debug
    debugAuth: () => {
      console.log('🔍 [AuthContext] Stan AuthContext:');
      console.log('User:', user);
      console.log('Loading:', loading);
      console.log('Error:', authError);
      console.log('Is Authenticated:', isAuthenticated());
      debugAuth();
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};