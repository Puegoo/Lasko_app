// frontend/lasko-frontend/src/hooks/useAuth.js - KOMPLETNIE NAPRAWIONY I ZSYNCHRONIZOWANY
import { useState, useEffect } from 'react';
import apiService from '../services/api';
import { isAuthenticated, getAccessToken, getTokenInfo, getUserData } from '../services/authService';

/**
 * Hook useAuth - alternatywa dla AuthContext dla komponentów, które nie mają dostępu do Context
 * UWAGA: Preferuj używanie AuthContext zamiast tego hooka w nowych komponentach!
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // INICJALIZACJA I SPRAWDZANIE STANU
  // ============================================================================
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [useAuth] Sprawdzanie stanu autoryzacji...');

      if (isAuthenticated()) {
        // Spróbuj pobrać dane z localStorage
        const userData = getUserData();
        if (userData) {
          setUser(userData);
          console.log('✅ [useAuth] Użytkownik załadowany z localStorage:', userData.username);
        }

        // Spróbuj odświeżyć dane profilu z serwera
        try {
          const profileData = await apiService.fetchUserProfile();
          if (profileData && profileData.user) {
            setUser(profileData.user);
            console.log('✅ [useAuth] Profil zaktualizowany z serwera:', profileData.user.username);
          }
        } catch (profileError) {
          console.warn('⚠️ [useAuth] Nie udało się pobrać profilu z serwera:', profileError.message);
          // Nie wyczyścić użytkownika - może być tymczasowy błąd sieci
        }
      } else {
        console.log('❌ [useAuth] Użytkownik nie jest zalogowany');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [useAuth] Błąd sprawdzania autoryzacji:', error);
      setError(error.message);
      
      // Jeśli błąd autoryzacji, wyczyść użytkownika
      if (error.message.includes('autoryzacji') || error.message.includes('401')) {
        apiService.logout();
        setUser(null);
      }
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
      setError(null);

      console.log('🔄 [useAuth] Rozpoczynam rejestrację:', userData.username);
      const response = await apiService.register(userData);
      console.log('✅ [useAuth] Rejestracja udana:', response);

      // Aktualizuj stan użytkownika
      if (response.user) {
        setUser(response.user);
      }

      // Jeśli nie ma tokenów, spróbuj zalogować automatycznie
      if (!isAuthenticated() && userData.email && userData.password) {
        console.log('🔄 [useAuth] Brak tokenów po rejestracji, wykonuję automatyczne logowanie');
        const loginResponse = await apiService.login({
          login: userData.email,
          password: userData.password
        });
        
        if (loginResponse.user) {
          setUser(loginResponse.user);
        }
      }

      return response;
    } catch (error) {
      console.error('❌ [useAuth] Błąd rejestracji:', error);
      setError(error.message);
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
      setError(null);

      console.log('🔄 [useAuth] Rozpoczynam logowanie:', credentials.login || credentials.email);
      const response = await apiService.login(credentials);
      console.log('✅ [useAuth] Logowanie udane:', response);

      // Aktualizuj stan użytkownika
      if (response.user) {
        setUser(response.user);
      }

      return response;
    } catch (error) {
      console.error('❌ [useAuth] Błąd logowania:', error);
      setError(error.message);
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
      console.log('🔓 [useAuth] Wylogowywanie użytkownika...');
      await apiService.logout();
      setUser(null);
      setError(null);
      console.log('✅ [useAuth] Użytkownik wylogowany');
    } catch (error) {
      console.error('❌ [useAuth] Błąd wylogowania:', error);
      // Mimo błędu wyczyść stan lokalny
      setUser(null);
      setError(null);
    }
  };

  // ============================================================================
  // FUNKCJE SPRAWDZAJĄCE I POMOCNICZE
  // ============================================================================
  const isUserAuthenticated = () => {
    return isAuthenticated() && !!user;
  };

  const getToken = () => {
    return getAccessToken();
  };

  const getCurrentUser = () => {
    return user || getUserData();
  };

  const refreshUserData = async () => {
    if (!isAuthenticated()) {
      return null;
    }

    try {
      const profileData = await apiService.fetchUserProfile();
      if (profileData && profileData.user) {
        setUser(profileData.user);
        return profileData.user;
      }
    } catch (error) {
      console.error('❌ [useAuth] Błąd odświeżania danych użytkownika:', error);
      throw error;
    }
  };

  // ============================================================================
  // FUNKCJE API
  // ============================================================================
  const updateProfile = async (profileData) => {
    try {
      console.log('🔄 [useAuth] Aktualizacja profilu użytkownika');
      const response = await apiService.updateUserProfile(profileData);
      
      // Odśwież dane użytkownika po aktualizacji
      if (response) {
        await refreshUserData();
      }
      
      return response;
    } catch (error) {
      console.error('❌ [useAuth] Błąd aktualizacji profilu:', error);
      setError(error.message);
      throw error;
    }
  };

  const generateRecommendations = async (method = 'hybrid', preferences = {}) => {
    try {
      console.log('🤖 [useAuth] Generowanie rekomendacji:', { method, preferences });
      return await apiService.generateRecommendations(method, preferences);
    } catch (error) {
      console.error('❌ [useAuth] Błąd generowania rekomendacji:', error);
      setError(error.message);
      throw error;
    }
  };

  // ============================================================================
  // FUNKCJE DEBUGOWANIA
  // ============================================================================
  const debugAuth = () => {
    console.log('🔍 [useAuth] === DIAGNOSTYKA useAuth HOOK ===');
    console.log('='.repeat(50));
    console.log('Hook State:');
    console.log('  user:', user);
    console.log('  loading:', loading);
    console.log('  error:', error);
    console.log('');
    console.log('Auth Service State:');
    console.log('  isAuthenticated:', isAuthenticated());
    console.log('  hasToken:', !!getAccessToken());
    console.log('  userData:', getUserData());
    
    const tokenInfo = getTokenInfo();
    if (tokenInfo) {
      console.log('  tokenInfo:', tokenInfo);
    }
    console.log('='.repeat(50));
  };

  // ============================================================================
  // RETURN HOOK VALUES
  // ============================================================================
  return {
    // Stan
    user,
    loading,
    error,
    
    // Funkcje autoryzacji
    register,
    login,
    logout,
    
    // Funkcje sprawdzające
    isAuthenticated: isUserAuthenticated,
    getToken,
    getCurrentUser,
    
    // Funkcje API
    updateProfile,
    generateRecommendations,
    refreshUserData,
    
    // Funkcje pomocnicze
    checkAuthStatus,
    debugAuth,
    
    // Kompatybilność z API service
    apiService
  };
};

export default useAuth;