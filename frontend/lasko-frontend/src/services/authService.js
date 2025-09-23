// frontend/lasko-frontend/src/services/authService.js - NAPRAWIONA WERSJA
// Poprawne API do zarządzania tokenami z walidacją JWT

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export function setTokens({ access, refresh, access_token, refresh_token }) {
  // Obsługuj różne formaty nazw tokenów
  const accessTokenValue = access || access_token;
  const refreshTokenValue = refresh || refresh_token;
  
  if (accessTokenValue) {
    localStorage.setItem(ACCESS_KEY, accessTokenValue);
    console.log('🔐 Token access zapisany');
  }
  if (refreshTokenValue) {
    localStorage.setItem(REFRESH_KEY, refreshTokenValue);
    console.log('🔐 Token refresh zapisany');
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || null;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || null;
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  console.log('🗑️ Tokeny wyczyszczone');
}

export function isAuthenticated() {
  const token = getAccessToken();
  
  if (!token) {
    console.log('🔍 isAuthenticated: Brak tokena');
    return false;
  }
  
  try {
    // Sprawdź czy token jest prawidłowy JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('🔍 isAuthenticated: Token nie jest prawidłowym JWT');
      return false;
    }
    
    // Zdekoduj payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Sprawdź czy token nie wygasł
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log('🔍 isAuthenticated: Token wygasł');
      clearTokens(); // Wyczyść wygasły token
      return false;
    }
    
    console.log('🔍 isAuthenticated: Token poprawny');
    return true;
  } catch (e) {
    console.log('🔍 isAuthenticated: Błąd dekodowania tokena:', e.message);
    clearTokens(); // Wyczyść nieprawidłowy token
    return false;
  }
}

// Dodatkowe funkcje debugowania
export function getTokenInfo() {
  const token = getAccessToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.user_id,
      username: payload.username,
      exp: payload.exp,
      expiresAt: new Date(payload.exp * 1000),
      isExpired: payload.exp * 1000 < Date.now()
    };
  } catch (e) {
    return null;
  }
}

export function debugAuth() {
  console.log('🔍 DEBUG AUTORYZACJI:');
  console.log('='.repeat(30));
  console.log('Access Token:', getAccessToken() ? 'OBECNY' : 'BRAK');
  console.log('Refresh Token:', getRefreshToken() ? 'OBECNY' : 'BRAK');
  console.log('Is Authenticated:', isAuthenticated());
  
  const tokenInfo = getTokenInfo();
  if (tokenInfo) {
    console.log('Token Info:', tokenInfo);
  }
}