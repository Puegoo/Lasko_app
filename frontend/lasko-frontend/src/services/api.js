// frontend/lasko-frontend/src/services/api.js - KOMPLETNIE NAPRAWIONY
import { 
  getAccessToken, 
  refreshAccessToken, 
  clearTokens,
  isTokenValid,
  setTokens,
  getUserData
} from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false; // Zapobiega wielokrotnym żądaniom refresh
    this.refreshPromise = null;
  }

  // ============================================================================
  // PODSTAWOWA METODA REQUEST Z AUTORYZACJĄ I RETRY
  // ============================================================================
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let attempt = 0;
    const maxAttempts = 2; // Pierwsze żądanie + retry po refresh

    while (attempt < maxAttempts) {
      attempt++;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      // Dodaj token autoryzacji jeśli dostępny
      const token = getAccessToken();
      if (token && isTokenValid(token)) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`🔐 [ApiService] Dodano Authorization header (próba ${attempt})`);
      } else if (token && !isTokenValid(token)) {
        console.warn('⚠️ [ApiService] Token nieprawidłowy lub wygasły');
        
        // Spróbuj odświeżyć token tylko przy pierwszej próbie
        if (attempt === 1) {
          try {
            await this.refreshTokenIfNeeded();
            const newToken = getAccessToken();
            if (newToken && isTokenValid(newToken)) {
              config.headers.Authorization = `Bearer ${newToken}`;
              console.log('✅ [ApiService] Token odświeżony, dodano Authorization header');
            }
          } catch (refreshError) {
            console.error('❌ [ApiService] Nie udało się odświeżyć tokenu:', refreshError);
            clearTokens();
          }
        }
      } else {
        console.log('ℹ️ [ApiService] Żądanie bez autoryzacji (brak tokenu)');
      }

      try {
        console.log(`🌐 [ApiService] ${config.method || 'GET'} ${url} (próba ${attempt})`);
        
        if (config.body && typeof config.body === 'string') {
          console.log('📤 [ApiService] Request payload:', JSON.parse(config.body));
        }

        const response = await fetch(url, config);
        
        console.log(`📥 [ApiService] Response: ${response.status} ${response.statusText}`);

        // Obsługa błędu 401 - tylko przy pierwszej próbie
        if (response.status === 401 && attempt === 1) {
          console.warn('🚨 [ApiService] Błąd 401 - próba odświeżenia tokenu...');
          
          try {
            await this.refreshTokenIfNeeded();
            // Kontynuuj pętlę while dla retry
            continue;
          } catch (refreshError) {
            console.error('❌ [ApiService] Odświeżanie tokenu nie powiodło się');
            clearTokens();
            throw new Error('Sesja wygasła - zaloguj się ponownie');
          }
        }

        // Parsuj odpowiedź
        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // Obsługa błędów HTTP
        if (!response.ok) {
          console.error('❌ [ApiService] Błąd HTTP:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData
          });

          // Stwórz czytelny błąd
          const errorMessage = this.extractErrorMessage(responseData, response.status);
          const error = new Error(errorMessage);
          error.status = response.status;
          error.response = responseData;
          
          throw error;
        }

        console.log('✅ [ApiService] Żądanie zakończone sukcesem');
        return responseData;

      } catch (error) {
        // Jeśli to błąd sieci i mamy jeszcze próby, spróbuj ponownie
        if (attempt < maxAttempts && this.isNetworkError(error)) {
          console.warn(`⚠️ [ApiService] Błąd sieci, retry (${attempt}/${maxAttempts}):`, error.message);
          await this.delay(1000); // Czekaj 1s przed retry
          continue;
        }

        // W przeciwnym razie rzuć błąd
        throw error;
      }
    }
  }

  // ============================================================================
  // ODŚWIEŻANIE TOKENÓW Z ZABEZPIECZENIEM PRZED WIELOKROTNYM WYWOŁANIEM
  // ============================================================================
  async refreshTokenIfNeeded() {
    // Jeśli już trwa odświeżanie, czekaj na zakończenie
    if (this.isRefreshing && this.refreshPromise) {
      console.log('🔄 [ApiService] Czekanie na zakończenie odświeżania tokenu...');
      return await this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = refreshAccessToken().finally(() => {
      this.isRefreshing = false;
      this.refreshPromise = null;
    });

    return await this.refreshPromise;
  }

  // ============================================================================
  // METODY POMOCNICZE
  // ============================================================================
  extractErrorMessage(responseData, status) {
    if (typeof responseData === 'string') {
      return responseData;
    }
    
    if (responseData && typeof responseData === 'object') {
      // Sprawdź różne formaty błędów z backendu
      if (responseData.message) {
        return responseData.message;
      }
      if (responseData.error) {
        return responseData.error;
      }
      if (responseData.errors && typeof responseData.errors === 'object') {
        // Błędy walidacji
        const errorMessages = [];
        Object.entries(responseData.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        });
        return errorMessages.join('\n');
      }
    }

    // Fallback na kod statusu
    const statusMessages = {
      400: 'Nieprawidłowe żądanie',
      401: 'Brak autoryzacji',
      403: 'Brak uprawnień',
      404: 'Nie znaleziono',
      500: 'Błąd serwera',
    };

    return statusMessages[status] || `Błąd HTTP ${status}`;
  }

  isNetworkError(error) {
    return error instanceof TypeError && error.message.includes('fetch');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // METODY AUTORYZACJI
  // ============================================================================
  async register(userData) {
    console.log('🔄 [ApiService] Rejestracja użytkownika:', userData.username);
    
    const response = await this.request('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Zapisz tokeny jeśli są w odpowiedzi
    if (response.tokens) {
      setTokens({
        access: response.tokens.access,
        refresh: response.tokens.refresh,
        user: response.user
      });
      console.log('✅ [ApiService] Tokeny zapisane po rejestracji');
    }

    return response;
  }

  async login(credentials) {
    console.log('🔄 [ApiService] Logowanie użytkownika:', credentials.login || credentials.email);
    
    const response = await this.request('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Zapisz tokeny
    if (response.tokens) {
      setTokens({
        access: response.tokens.access,
        refresh: response.tokens.refresh,
        user: response.user
      });
      console.log('✅ [ApiService] Tokeny zapisane po logowaniu');
    }

    return response;
  }

  async logout() {
    console.log('🔓 [ApiService] Wylogowanie');
    
    try {
      await this.request('/api/auth/logout/', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('⚠️ [ApiService] Błąd wylogowania na serwerze:', error.message);
    } finally {
      clearTokens();
      console.log('✅ [ApiService] Tokeny wyczyszczone');
    }
  }

  // ============================================================================
  // METODY PROFILU UŻYTKOWNIKA
  // ============================================================================
  async getProfile() {
    console.log('🔄 [ApiService] Pobieranie profilu użytkownika');
    return await this.request('/api/auth/profile/', {
      method: 'GET',
    });
  }

  async updateProfile(profileData) {
    console.log('🔄 [ApiService] Aktualizacja profilu użytkownika');
    return await this.request('/api/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // ============================================================================
  // METODY REKOMENDACJI I PLANÓW
  // ============================================================================
  async generateRecommendations(mode = 'hybrid', preferences = {}, top = 3) {
    console.log('🤖 [ApiService] Generowanie rekomendacji:', { mode, preferences, top });
    
    return await this.request('/api/recommendations/', {
      method: 'POST',
      body: JSON.stringify({
        mode,
        preferences,
        top
      }),
    });
  }

  async getPlanDetails(planId) {
    console.log('🔄 [ApiService] Pobieranie szczegółów planu:', planId);
    return await this.request(`/api/plans/${planId}/detailed/`, {
      method: 'GET',
    });
  }

  async activatePlan(planId) {
    console.log('🔄 [ApiService] Aktywacja planu:', planId);
    return await this.request(`/api/plans/${planId}/activate/`, {
      method: 'POST',
    });
  }

  async createCustomPlan(planData) {
    console.log('🔄 [ApiService] Tworzenie niestandardowego planu');
    return await this.request('/api/plans/', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  // ============================================================================
  // FUNKCJE SPRAWDZAJĄCE
  // ============================================================================
  isAuthenticated() {
    const token = getAccessToken();
    const user = getUserData();
    const isValid = token && isTokenValid(token) && user;
    
    console.log('🔍 [ApiService] Sprawdzanie autoryzacji:', {
      hasToken: !!token,
      tokenValid: token ? isTokenValid(token) : false,
      hasUser: !!user,
      result: !!isValid
    });
    
    return !!isValid;
  }

  getAccessToken() {
    return getAccessToken();
  }

  getCurrentUser() {
    return getUserData();
  }

  // ============================================================================
  // DEBUG
  // ============================================================================
  debugStatus() {
    console.log('🔍 [ApiService] === STATUS SERWISU API ===');
    console.log('Base URL:', this.baseURL);
    console.log('Is Authenticated:', this.isAuthenticated());
    console.log('Current User:', this.getCurrentUser()?.username);
    console.log('Access Token:', this.getAccessToken() ? 'PRESENT' : 'MISSING');
    console.log('Token Valid:', this.getAccessToken() ? isTokenValid(this.getAccessToken()) : false);
  }
}

// Eksportuj singleton
const apiService = new ApiService();

// Dodaj do window dla debugowania
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.ApiService = apiService;
}

export default apiService;