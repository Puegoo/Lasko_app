// frontend/lasko-frontend/src/contexts/AuthContext.jsx (POPRAWIONY)
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Sprawdź token przy ładowaniu aplikacji
  useEffect(() => {
    const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Wyczyść nieprawidłowe dane
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
      }
    }
    
    setLoading(false);
  }, []);

  // Funkcja do zapisywania tokenów (centralna)
  const saveTokens = (accessToken, refreshToken, userData) => {
    // Zapisz w obu formatach dla kompatybilności
    localStorage.setItem('token', accessToken);
    localStorage.setItem('access_token', accessToken);
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
    
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    
    setToken(accessToken);
  };

  // Funkcja rejestracji
  const register = async (userData) => {
    try {
      console.log('🔍 AuthContext - Rozpoczynam rejestrację:', userData);
      
      const response = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const responseText = await response.text();
      console.log('📥 AuthContext - Raw response:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: 'Błąd serwera' };
        }
        
        console.error('❌ AuthContext - Registration failed:', errorData);
        
        // Przekształć błędy z backendu
        const error = new Error(errorData.message || 'Registration failed');
        error.validationErrors = errorData.errors || errorData;
        throw error;
      }

      const data = JSON.parse(responseText);
      console.log('✅ AuthContext - Registration success:', data);
      
      // Zapisz tokeny i dane użytkownika
      if (data.tokens || (data.access && data.refresh)) {
        const accessToken = data.tokens?.access || data.access;
        const refreshToken = data.tokens?.refresh || data.refresh;
        const userData = data.user;
        
        console.log('💾 AuthContext - Saving tokens:', { 
          hasAccess: !!accessToken, 
          hasRefresh: !!refreshToken, 
          hasUser: !!userData 
        });
        
        saveTokens(accessToken, refreshToken, userData);
      } else {
        console.warn('⚠️ AuthContext - No tokens in registration response');
      }

      return data;
    } catch (error) {
      console.error('❌ AuthContext - Registration error:', error);
      throw error;
    }
  };

  // Funkcja logowania
  const login = async (credentials) => {
    try {
      console.log('🔍 AuthContext - Starting login:', credentials.login);
      
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('✅ AuthContext - Login success:', data);
      
      // Zapisz tokeny i dane użytkownika
      const accessToken = data.tokens?.access || data.access;
      const refreshToken = data.tokens?.refresh || data.refresh;
      const userData = data.user;
      
      if (accessToken && userData) {
        saveTokens(accessToken, refreshToken, userData);
      }

      return data;
    } catch (error) {
      console.error('❌ AuthContext - Login error:', error);
      throw error;
    }
  };

  // Funkcja wylogowania
  const logout = () => {
    console.log('🔓 AuthContext - Logging out');
    
    // Wyczyść wszystkie wersje tokenów
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    setToken(null);
    setUser(null);
  };

  // Funkcja odświeżania tokenu
  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
      if (!refresh) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newAccessToken = data.access;
      
      if (newAccessToken) {
        // Zapisz tylko nowy access token
        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('access_token', newAccessToken);
        setToken(newAccessToken);
        
        return newAccessToken;
      } else {
        throw new Error('No access token in refresh response');
      }
      
    } catch (error) {
      console.error('❌ AuthContext - Token refresh error:', error);
      logout(); // Wyloguj użytkownika jeśli odświeżanie się nie powiodło
      throw error;
    }
  };

  // Funkcja sprawdzania czy użytkownik jest zalogowany
  const isAuthenticated = () => {
    const currentToken = token || localStorage.getItem('token') || localStorage.getItem('access_token');
    const currentUser = user || (() => {
      try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch {
        return null;
      }
    })();
    
    return !!(currentToken && currentUser);
  };

  // Funkcja do pobierania aktualnego tokenu
  const getToken = () => {
    return token || localStorage.getItem('token') || localStorage.getItem('access_token');
  };

  const value = {
    user,
    token: getToken(),
    loading,
    register,
    login,
    logout,
    refreshToken,
    isAuthenticated,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};