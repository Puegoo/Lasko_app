import { useState, useEffect } from 'react';
import apiService from '../services/api';

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
      // Jeśli token jest nieprawidłowy, wyloguj użytkownika
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
      
      console.log('useAuth: Rozpoczynam rejestrację z danymi:', userData);
      
      const response = await apiService.register(userData);
      
      console.log('useAuth: Odpowiedź z API:', response);
      
      // Ustaw dane użytkownika po pomyślnej rejestracji
      setUser({
        user: response.user,
        profile: response.profile
      });
      
      return response;
    } catch (error) {
      console.error('useAuth: Błąd rejestracji:', error);
      setError(error.message);
      throw error; // Przekaż błąd dalej do komponentu
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
      
      // Ustaw dane użytkownika po pomyślnym logowaniu
      setUser({
        user: response.user,
        profile: response.profile
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
      
      // Zaktualizuj dane użytkownika
      setUser({
        user: response.user,
        profile: response.profile
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

  const clearError = () => {
    setError(null);
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
    // Dodatkowe gettery dla łatwiejszego dostępu
    userData: user?.user || null,
    profileData: user?.profile || null,
  };
};