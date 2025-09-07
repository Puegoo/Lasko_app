// frontend/lasko-frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import apiService from '../services/api';
import { setTokens } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (apiService.isAuthenticated()) {
        const profileData = await apiService.getProfile();
        setUser(profileData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      apiService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper: ekstrakcja tokenów z możliwych formatów odpowiedzi
  const extractTokens = (res) => {
    const data = res?.data ?? res;
    const access =
      data?.access ||
      data?.access_token ||
      data?.tokens?.access ||
      data?.tokens?.access_token;
    const refresh =
      data?.refresh ||
      data?.refresh_token ||
      data?.tokens?.refresh ||
      data?.tokens?.refresh_token;
    return { access, refresh };
  };

  const persistTokens = ({ access, refresh }) => {
    if (access) {
      setTokens({
        access_token: access,
        refresh_token: refresh || null,
      });
      return true;
    }
    return false;
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('useAuth: Rozpoczynam rejestrację z danymi:', userData);
      const response = await apiService.register(userData);
      console.log('useAuth: Odpowiedź z API (register):', response);

      // 1) Spróbuj zapisać tokeny z rejestracji
      const regTokens = extractTokens(response);
      const saved = persistTokens(regTokens);

      // 2) Jeżeli tokenów brak — automatyczny login
      if (!saved) {
        const loginRes = await apiService.login({
          email: userData.email,
          password: userData.password,
        });
        const loginTokens = extractTokens(loginRes);
        persistTokens(loginTokens);

        setUser({
          user: loginRes.user || loginRes?.data?.user || null,
          profile: loginRes.profile || loginRes?.data?.profile || null,
        });

        return loginRes;
      }

      // Tokeny były w odpowiedzi register — ustaw usera
      setUser({
        user: response.user || response?.data?.user || null,
        profile: response.profile || response?.data?.profile || null,
      });

      return response;
    } catch (error) {
      console.error('useAuth: Błąd rejestracji:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      console.log('useAuth: Rozpoczynam logowanie:', credentials.email);
      const response = await apiService.login(credentials);
      console.log('useAuth: Pomyślne logowanie:', response);

      const tokens = extractTokens(response);
      persistTokens(tokens);

      setUser({
        user: response.user || response?.data?.user || null,
        profile: response.profile || response?.data?.profile || null,
      });

      return response;
    } catch (error) {
      console.error('useAuth: Błąd logowania:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('useAuth: Wylogowywanie użytkownika');
    apiService.logout();
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.updateProfile(profileData);

      setUser({
        user: response.user || response?.data?.user || null,
        profile: response.profile || response?.data?.profile || null,
      });

      return response;
    } catch (error) {
      console.error('useAuth: Błąd aktualizacji profilu:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const setRecommendationMethod = async (method) => {
    try {
      setError(null);
      console.log('useAuth: Ustawianie metody rekomendacji:', method);
      const response = await apiService.setRecommendationMethod(method);
      console.log('useAuth: Metoda rekomendacji ustawiona:', response);
      return response;
    } catch (error) {
      console.error('useAuth: Błąd ustawiania metody rekomendacji:', error);
      setError(error.message);
      throw error;
    }
  };

  const generateRecommendations = async (method) => {
    try {
      setError(null);
      console.log('useAuth: Generowanie rekomendacji metodą:', method);
      const response = await apiService.generateRecommendations(method);
      console.log('useAuth: Rekomendacje wygenerowane:', response);
      return response;
    } catch (error) {
      console.error('useAuth: Błąd generowania rekomendacji:', error);
      setError(error.message);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!user,
    userData: user?.user || null,
    profileData: user?.profile || null,
    setRecommendationMethod,
    generateRecommendations,
  };
};
