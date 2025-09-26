// frontend/lasko-frontend/src/contexts/AuthContext.jsx - NAPRAWIONY IMPORT
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  setTokens, 
  getAccessToken, 
  getUserData, 
  clearTokens, 
  isAuthenticated as checkAuth,
  refreshAccessToken,
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
  const setUserData = (userData) => {
    // Użyj setTokens żeby zapisać dane użytkownika
    if (userData.tokens) {
      setTokens({
        ...userData.tokens,
        user: userData.user || userData
      });
    } else {
      // Jeśli brak tokenów, zapisz tylko user data
      localStorage.setItem('user_data', JSON.stringify(userData.user || userData));
    }
    setUser(userData.user || userData);
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
      
      const response = await apiService.register(userData);
      
      if (response.tokens && response.user) {
        setTokens(response.tokens);
        setUserData(response);
        console.log('✅ [AuthContext] Rejestracja pomyślna:', response.user.username);
        return response;
      } else {
        throw new Error('Nieprawidłowa odpowiedź serwera');
      }
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
      
      const response = await apiService.login(credentials);
      
      if (response.tokens && response.user) {
        setTokens(response.tokens);
        setUserData(response);
        console.log('✅ [AuthContext] Logowanie pomyślne:', response.user.username);
        return response;
      } else {
        throw new Error('Nieprawidłowa odpowiedź serwera');
      }
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
      
      const response = await apiService.fetchUserProfile();
      
      setUserData(response);
      console.log('✅ [AuthContext] Profil zaktualizowany:', response.user?.username);
      
      return response;
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
      
      if (!isAuthenticated()) {
        throw new Error('Brak autoryzacji - zaloguj się ponownie');
      }

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