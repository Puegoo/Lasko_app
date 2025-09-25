// frontend/lasko-frontend/src/contexts/AuthContext.jsx - KOMPLETNIE NAPRAWIONY
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
  // INICJALIZACJA - sprawdź czy użytkownik jest zalogowany
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
        
        // Opcjonalnie: sprawdź aktualność danych profilu
        try {
          await fetchUserProfile();
        } catch (error) {
          console.warn('⚠️ [AuthContext] Nie udało się pobrać profilu:', error.message);
          // Nie wylogowuj - może być tymczasowy błąd sieciowy
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
  // POBIERANIE PROFILU UŻYTKOWNIKA
  // ============================================================================
  const fetchUserProfile = async () => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Brak tokenu autoryzacji');
    }

    console.log('🔄 [AuthContext] Pobieranie profilu użytkownika...');

    const response = await fetch('/api/auth/profile/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token wygasł - spróbuj odświeżyć
      try {
        console.log('🔄 [AuthContext] Token wygasł, próba odświeżenia...');
        await refreshAccessToken();
        // Powtórz żądanie z nowym tokenem
        return fetchUserProfile();
      } catch (refreshError) {
        console.error('❌ [AuthContext] Nie udało się odświeżyć tokenu:', refreshError);
        logout();
        throw new Error('Sesja wygasła - zaloguj się ponownie');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const profileData = await response.json();
    console.log('✅ [AuthContext] Profil pobrany:', profileData.user?.username);
    
    return profileData;
  };

  // ============================================================================
  // REJESTRACJA
  // ============================================================================
  const register = async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('🔄 [AuthContext] Rozpoczynam rejestrację:', userData.username);

      const response = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ [AuthContext] Błąd rejestracji:', responseData);
        
        // Obsłuż błędy walidacji
        if (responseData.errors && typeof responseData.errors === 'object') {
          const errorMessages = [];
          Object.entries(responseData.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          });
          throw new Error(errorMessages.join('\n'));
        }
        
        throw new Error(responseData.message || 'Błąd rejestracji');
      }

      console.log('✅ [AuthContext] Rejestracja udana:', responseData);

      // Zapisz tokeny jeśli są w odpowiedzi
      if (responseData.tokens) {
        setTokens({
          access: responseData.tokens.access,
          refresh: responseData.tokens.refresh,
          user: responseData.user
        });
        setUser(responseData.user);
      }

      return responseData;
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
      
      console.log('🔄 [AuthContext] Rozpoczynam logowanie dla:', credentials.login || credentials.email);

      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ [AuthContext] Błąd logowania:', responseData);
        throw new Error(responseData.message || 'Błąd logowania');
      }

      console.log('✅ [AuthContext] Logowanie udane:', responseData);

      // Zapisz tokeny i dane użytkownika
      if (responseData.tokens && responseData.user) {
        setTokens({
          access: responseData.tokens.access,
          refresh: responseData.tokens.refresh,
          user: responseData.user
        });
        setUser(responseData.user);
      } else {
        throw new Error('Brak tokenów w odpowiedzi serwera');
      }

      return responseData;
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
    console.log('🔓 [AuthContext] Wylogowywanie użytkownika...');
    
    // Opcjonalnie wyślij żądanie wylogowania na serwer
    try {
      const token = getAccessToken();
      if (token) {
        await fetch('/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.warn('⚠️ [AuthContext] Błąd podczas wylogowania na serwerze:', error);
      // Kontynuuj lokalnie
    }

    // Wyczyść stan lokalny
    clearTokens();
    setUser(null);
    setAuthError(null);
    
    console.log('✅ [AuthContext] Użytkownik wylogowany');
  };

  // ============================================================================
  // FUNKCJE POMOCNICZE
  // ============================================================================
  const isAuthenticated = () => {
    return checkAuth() && !!user;
  };

  const getToken = () => {
    return getAccessToken();
  };

  const getCurrentUser = () => {
    return user || getUserData();
  };

  // ============================================================================
  // GENEROWANIE REKOMENDACJI (dla EnhancedPlanCreator)
  // ============================================================================
  const generateRecommendations = async (method = 'hybrid', preferences = {}) => {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Brak autoryzacji - zaloguj się ponownie');
    }

    console.log('🤖 [AuthContext] Generowanie rekomendacji:', { method, preferences });

    const response = await fetch('/api/recommendations/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: method,
        preferences,
        top: 3
      }),
    });

    if (response.status === 401) {
      throw new Error('Brak autoryzacji - zaloguj się ponownie');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Błąd generowania rekomendacji');
    }

    const data = await response.json();
    console.log('✅ [AuthContext] Rekomendacje wygenerowane:', data);
    
    return data;
  };

  // Debug w trybie development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.AuthContext = {
        user,
        isAuthenticated: isAuthenticated(),
        debugAuth,
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