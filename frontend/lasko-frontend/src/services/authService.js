// frontend/lasko-frontend/src/services/authService.js - KOMPLETNIE NAPRAWIONY
// Centralny serwis do zarządzania tokenami JWT z pełną walidacją i debugowaniem
// ZSYNCHRONIZOWANY Z ApiService

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ============================================================================
// STAŁE KLUCZY LOCALSTORAGE (zsynchronizowane z ApiService)
// ============================================================================
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
      console.log('❌ [AuthService] Nieprawidłowy format JWT');
      return false;
    }

    // Spróbuj zdekodować payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Sprawdź wygaśnięcie
    const isExpired = payload.exp * 1000 < Date.now();
    
    if (isExpired) {
      console.log('⚠️ [AuthService] Token wygasł:', new Date(payload.exp * 1000));
      return false;
    }

    console.log('✅ [AuthService] Token jest prawidłowy');
    return true;
  } catch (error) {
    console.error('❌ [AuthService] Błąd walidacji tokenu:', error);
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
    
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
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
// FUNKCJE AUTORYZACJI
// ============================================================================

export async function login(credentials) {
  try {
    console.log('🔄 [AuthService] Logowanie użytkownika:', credentials.login || credentials.email);

    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ [AuthService] Błąd logowania:', responseData);
      throw new Error(responseData.message || 'Błąd logowania');
    }

    console.log('✅ [AuthService] Logowanie udane:', responseData);

    // Zapisz tokeny i dane użytkownika
    if (responseData.tokens && responseData.user) {
      setTokens({
        access: responseData.tokens.access,
        refresh: responseData.tokens.refresh,
        user: responseData.user
      });
    } else {
      throw new Error('Brak tokenów w odpowiedzi serwera');
    }

    return responseData;
  } catch (error) {
    console.error('❌ [AuthService] Błąd logowania:', error);
    throw error;
  }
}

export async function register(userData) {
  try {
    console.log('🔄 [AuthService] Rejestracja użytkownika:', userData.username);

    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ [AuthService] Błąd rejestracji:', responseData);
      
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

    console.log('✅ [AuthService] Rejestracja udana:', responseData);

    // Zapisz tokeny jeśli są w odpowiedzi
    if (responseData.tokens) {
      setTokens({
        access: responseData.tokens.access,
        refresh: responseData.tokens.refresh,
        user: responseData.user
      });
    }

    return responseData;
  } catch (error) {
    console.error('❌ [AuthService] Błąd rejestracji:', error);
    throw error;
  }
}

export async function logout() {
  console.log('🔓 [AuthService] Wylogowanie użytkownika...');
  
  // Opcjonalnie wyślij żądanie wylogowania na serwer
  try {
    const token = getAccessToken();
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.warn('⚠️ [AuthService] Błąd podczas wylogowania na serwerze:', error);
    // Kontynuuj lokalnie
  }

  // Wyczyść stan lokalny
  clearTokens();
  console.log('✅ [AuthService] Użytkownik wylogowany');
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
  console.log('User Data:', userData ? `OBECNY ✅ (${userData.username})` : 'BRAK ❌');
  console.log('Is Authenticated:', isAuthenticated() ? 'TAK ✅' : 'NIE ❌');
  
  if (tokenInfo) {
    console.log('Token Info:', {
      userId: tokenInfo.userId,
      username: tokenInfo.username,
      expiresAt: tokenInfo.expiresAt,
      isExpired: tokenInfo.isExpired,
      timeToExpiryMinutes: Math.round(tokenInfo.timeToExpiry / 60000)
    });
  }
  
  if (accessToken) {
    try {
      console.log('Token Valid:', isTokenValid(accessToken) ? 'TAK ✅' : 'NIE ❌');
    } catch (error) {
      console.log('Token Validation Error:', error.message);
    }
  }
  
  console.log('='.repeat(50));
}

// Test prostego API call
export async function testAuthenticatedRequest() {
  const token = getAccessToken();
  
  if (!token) {
    console.log('❌ [AuthService] Brak tokenu - nie można testować');
    return false;
  }
  
  try {
    console.log('🧪 [AuthService] Test autoryzowanego żądania...');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 [AuthService] Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ [AuthService] Test autoryzacji UDANY:', data.user?.username);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ [AuthService] Test autoryzacji NIEUDANY:', errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ [AuthService] Błąd sieciowy podczas testu:', error);
    return false;
  }
}

// ============================================================================
// EKSPORT DOMYŚLNY DLA KOMPATYBILNOŚCI
// ============================================================================
export default {
  setTokens,
  getAccessToken,
  getRefreshToken,
  getUserData,
  clearTokens,
  isTokenValid,
  isAuthenticated,
  getTokenInfo,
  refreshAccessToken,
  login,
  register,
  logout,
  debugAuth,
  testAuthenticatedRequest
};

// Debug w trybie development
if (import.meta.env.DEV) {
  window.AuthService = {
    setTokens,
    getAccessToken,
    getRefreshToken,
    getUserData,
    clearTokens,
    isAuthenticated,
    debugAuth,
    testAuthenticatedRequest
  };
  console.log('🔧 [AuthService] Debug functions dostępne przez window.AuthService');
}