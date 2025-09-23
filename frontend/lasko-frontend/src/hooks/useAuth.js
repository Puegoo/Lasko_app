// frontend/lasko-frontend/src/hooks/useAuth.js - NAPRAWIONY I ZSYNCHRONIZOWANY
import { useState, useEffect } from 'react';
import apiService from '../services/api';
import { isAuthenticated, getAccessToken, getTokenInfo } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (isAuthenticated()) {
        const profileData = await apiService.getProfile();
        setUser(profileData);
        console.log('✅ useAuth: Stan autoryzacji potwierdzony');
      } else {
        console.log('❌ useAuth: Brak autoryzacji');
      }
    } catch (error) {
      console.error('❌ useAuth: Błąd sprawdzania autoryzacji:', error);
      apiService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 useAuth: Rozpoczynam rejestrację:', userData.username);
      const response = await apiService.register(userData);
      console.log('✅ useAuth: Rejestracja udana:', response);

      // Jeśli nie ma tokenów w odpowiedzi, spróbuj zalogować
      if (!isAuthenticated()) {
        console.log('🔄 useAuth: Brak tokenów, wykonuję automatyczny login');
        const loginRes = await apiService.login({
          email: userData.email,
          password: userData.password,
        });
        setUser(loginRes);
        return loginRes;
      }

      setUser(response);
      return response;
    } catch (error) {
      console.error('❌ useAuth: Błąd rejestracji:', error);
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

      console.log('🔄 useAuth: Rozpoczynam logowanie:', credentials.email);
      const response = await apiService.login(credentials);
      console.log('✅ useAuth: Logowanie udane');

      setUser(response);
      return response;
    } catch (error) {
      console.error('❌ useAuth: Błąd logowania:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🔄 useAuth: Wylogowywanie');
    apiService.logout();
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.updateProfile(profileData);
      setUser(response);
      return response;
    } catch (error) {
      console.error('❌ useAuth: Błąd aktualizacji profilu:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setRecommendationMethod = async (method) => {
    try {
      setError(null);
      console.log('🔄 useAuth: Ustawianie metody rekomendacji:', method);
      const response = await apiService.setRecommendationMethod(method);
      console.log('✅ useAuth: Metoda rekomendacji ustawiona');
      return response;
    } catch (error) {
      console.error('❌ useAuth: Błąd ustawiania metody rekomendacji:', error);
      setError(error.message);
      throw error;
    }
  };

  const generateRecommendations = async (method) => {
    try {
      setError(null);
      console.log('🔄 useAuth: Generowanie rekomendacji metodą:', method);
      const response = await apiService.generateRecommendations(method);
      console.log('✅ useAuth: Rekomendacje wygenerowane');
      return response;
    } catch (error) {
      console.error('❌ useAuth: Błąd generowania rekomendacji:', error);
      setError(error.message);
      throw error;
    }
  };

  // Dodatkowe funkcje pomocnicze
  const getToken = () => getAccessToken();
  const getAuthInfo = () => getTokenInfo();
  const clearError = () => setError(null);

  return {
    // Stan
    user,
    loading,
    error,
    
    // Dane użytkownika
    userData: user?.user || null,
    profileData: user?.profile || null,
    
    // Funkcje auth
    register,
    login,
    logout,
    updateProfile,
    clearError,
    
    // Funkcje rekomendacji
    setRecommendationMethod,
    generateRecommendations,
    
    // Stan autoryzacji - WAŻNE: użyj funkcji z authService
    isAuthenticated: () => isAuthenticated(),
    getToken,
    getAuthInfo,
  };
};