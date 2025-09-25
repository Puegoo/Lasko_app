// frontend/lasko-frontend/src/services/authService.js - KOMPLETNIE NAPRAWIONY
// Centralny serwis do zarządzania tokenami JWT z pełną walidacją i debugowaniem

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

// ============================================================================
// FUNKCJE DO ZARZĄDZANIA TOKENAMI
// ============================================================================

export function setTokens(tokenData) {
  console.log('🔐 [AuthService] Zapisywanie tokenów:', {
    hasAccess: !!(tokenData.access || tokenData.access_token),
    hasRefresh: !!(tokenData.refresh || tokenData.refresh_token),
    hasUser: !!tokenData.user
  });

  // Obsługuj różne formaty nazw tokenów z backendu
  const accessToken = tokenData.access || tokenData.access_token;
  const refreshToken = tokenData.refresh || tokenData.refresh_token;
  const userData = tokenData.user;

  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    console.log('✅ [AuthService] Access token zapisany');
  }
  
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    console.log('✅ [AuthService] Refresh token zapisany');
  }

  if (userData) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    console.log('✅ [AuthService] Dane użytkownika zapisane');
  }
}

export function getAccessToken() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    console.log('🔍 [AuthService] Access token pobrany');
  } else {
    console.log('⚠️ [AuthService] Brak access token');
  }
  return token;
}

export function getRefreshToken() {
  const token = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (token) {
    console.log('🔍 [AuthService] Refresh token pobrany');
  } else {
    console.log('⚠️ [AuthService] Brak refresh token');
  }
  return token;
}

export function getUserData() {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      console.log('🔍 [AuthService] Dane użytkownika pobrane:', parsed.username || parsed.email);
      return parsed;
    }
  } catch (error) {
    console.error('❌ [AuthService] Błąd parsowania danych użytkownika:', error);
    localStorage.removeItem(USER_DATA_KEY);
  }
  return null;
}

export function clearTokens() {
  console.log('🗑️ [AuthService] Czyszczenie wszystkich tokenów');
  
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  
  // Usuń też legacy klucze dla kompatybilności wstecznej
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
  
  console.log('✅ [AuthService] Wszystkie tokeny wyczyszczone');
}

// ============================================================================
// WALIDACJA I WERYFIKACJA TOKENÓW
// ============================================================================

export function isTokenValid(token) {
  if (!token) {
    console.log('🔍 [AuthService] Brak tokenu do walidacji');
    return false;
  }

  try {
    // Sprawdź format JWT (3 części oddzielone kropkami)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('🔍 [AuthService] Token nie ma prawidłowego formatu JWT');
      return false;
    }

    // Zdekoduj payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Sprawdź czy token nie wygasł
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log('🔍 [AuthService] Token wygasł:', {
        exp: new Date(payload.exp * 1000),
        now: new Date()
      });
      return false;
    }

    console.log('✅ [AuthService] Token jest prawidłowy');
    return true;
  } catch (error) {
    console.log('🔍 [AuthService] Błąd walidacji tokenu:', error.message);
    return false;
  }
}

export function isAuthenticated() {
  const token = getAccessToken();
  const isValid = isTokenValid(token);
  
  console.log('🔍 [AuthService] Sprawdzanie autoryzacji:', {
    hasToken: !!token,
    isValid,
    hasUserData: !!getUserData()
  });
  
  return isValid && !!getUserData();
}

// ============================================================================
// INFORMACJE O TOKENIE
// ============================================================================

export function getTokenInfo() {
  const token = getAccessToken();
  if (!token || !isTokenValid(token)) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return {
      userId: payload.user_id || payload.sub,
      username: payload.username,
      exp: payload.exp,
      expiresAt: new Date(payload.exp * 1000),
      isExpired: payload.exp * 1000 < Date.now(),
      timeToExpiry: payload.exp * 1000 - Date.now()
    };
  } catch (error) {
    console.error('❌ [AuthService] Błąd dekodowania tokenu:', error);
    return null;
  }
}

// ============================================================================
// ODŚWIEŻANIE TOKENÓW
// ============================================================================

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.error('❌ [AuthService] Brak refresh token - nie można odświeżyć');
    throw new Error('Brak refresh token');
  }

  try {
    console.log('🔄 [AuthService] Odświeżanie access token...');
    
    const response = await fetch('/api/auth/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const newAccessToken = data.access || data.access_token;

    if (!newAccessToken) {
      throw new Error('Brak access token w odpowiedzi');
    }

    // Zapisz nowy access token
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    console.log('✅ [AuthService] Access token odświeżony pomyślnie');
    
    return newAccessToken;
  } catch (error) {
    console.error('❌ [AuthService] Błąd odświeżania tokenu:', error);
    clearTokens(); // Wyczyść nieprawidłowe tokeny
    throw error;
  }
}

// ============================================================================
// FUNKCJE DEBUGOWANIA
// ============================================================================

export function debugAuth() {
  console.log('🔍 [AuthService] === DIAGNOSTYKA AUTORYZACJI ===');
  console.log('='.repeat(50));
  
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const userData = getUserData();
  const tokenInfo = getTokenInfo();
  
  console.log('Access Token:', accessToken ? 'OBECNY ✅' : 'BRAK ❌');
  console.log('Refresh Token:', refreshToken ? 'OBECNY ✅' : 'BRAK ❌');
  console.log('User Data:', userData ? `OBECNE ✅ (${userData.username || userData.email})` : 'BRAK ❌');
  console.log('Is Authenticated:', isAuthenticated() ? 'TAK ✅' : 'NIE ❌');
  
  if (tokenInfo) {
    console.log('Token Info:');
    console.log(`  User ID: ${tokenInfo.userId}`);
    console.log(`  Username: ${tokenInfo.username}`);
    console.log(`  Expires At: ${tokenInfo.expiresAt}`);
    console.log(`  Is Expired: ${tokenInfo.isExpired ? 'TAK ❌' : 'NIE ✅'}`);
    console.log(`  Time to Expiry: ${Math.round(tokenInfo.timeToExpiry / 1000 / 60)} minutes`);
  }
  
  console.log('='.repeat(50));
}

// Dodaj funkcje do window dla debugowania w konsoli
if (typeof window !== 'undefined') {
  window.AuthDebug = {
    debugAuth,
    getTokenInfo,
    isAuthenticated,
    clearTokens,
    getAccessToken,
    getRefreshToken,
    getUserData
  };
}