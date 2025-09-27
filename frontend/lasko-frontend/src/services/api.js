// frontend/lasko-frontend/src/services/api.js - NAPRAWIONY PROXY
import { 
  getAccessToken, 
  refreshAccessToken, 
  clearTokens,
  isTokenValid,
  setTokens,
  getUserData,
  getRefreshToken
} from './authService';

// ✅ NAPRAWIONE: Używaj proxy zamiast bezpośredniego API URL
const API_BASE_URL = ''; // Puste - używa proxy Vite: /api -> http://localhost:8000

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  // ============================================================================
  // PODSTAWOWA METODA REQUEST Z AUTORYZACJĄ I RETRY
  // ============================================================================
  async request(endpoint, options = {}) {
    // ✅ NAPRAWIONE: URL używa proxy
    const url = `${this.baseURL}${endpoint}`;
    let attempt = 0;
    const maxAttempts = 2;

    console.log(`🌐 [ApiService] Request: ${options.method || 'GET'} ${url}`);

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
      const refresh = getRefreshToken();

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
      } else if (!token && attempt === 1 && refresh) {
          console.warn('ℹ️ [ApiService] Brak access, ale jest refresh – próbuję odświeżyć zanim wyślę żądanie');
          try {
            await this.refreshTokenIfNeeded();
            continue; // spróbuj jeszcze raz z już wstawionym Authorization
          } catch (e) {
            console.error('❌ [ApiService] Early refresh nie powiódł się:', e);
            clearTokens();
          }
      } else {
        console.log('ℹ️ [ApiService] Brak tokenu - żądanie bez autoryzacji');
      }

      try {
        console.log('📤 [ApiService] Wysyłanie żądania:', config.method || 'GET', url);
        console.log('📋 [ApiService] Headers:', Object.keys(config.headers));
        
        const response = await fetch(url, config);
        
        console.log(`📥 [ApiService] Odpowiedź: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          if (response.status === 401 && attempt === 1) {
            console.warn('🔄 [ApiService] 401 - próba odświeżenia tokenu');
            // Spróbuj odświeżyć token i spróbuj ponownie
            try {
              await this.refreshTokenIfNeeded();
              continue; // Ponów próbę z nowym tokenem
            } catch (refreshError) {
              console.error('❌ [ApiService] Nie udało się odświeżyć tokenu:', refreshError);
              clearTokens();
              throw new Error('Sesja wygasła - zaloguj się ponownie');
            }
          }

          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json().catch(() => ({}));
        console.log('✅ [ApiService] Sukces:', Object.keys(data));
        return data;

      } catch (error) {
        if (attempt === maxAttempts) {
          console.error(`❌ [ApiService] Ostateczny błąd (próba ${attempt}/${maxAttempts}):`, error.message);
          throw error;
        }
        console.warn(`⚠️ [ApiService] Błąd (próba ${attempt}/${maxAttempts}):`, error.message);
      }
    }
  }

  // ============================================================================
  // ODŚWIEŻANIE TOKENU
  // ============================================================================
  async refreshTokenIfNeeded() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = refreshAccessToken()
      .then((tokens) => {
        console.log('✅ [ApiService] Token odświeżony pomyślnie');
        return tokens;
      })
      .catch((error) => {
        console.error('❌ [ApiService] Błąd odświeżania tokenu:', error);
        clearTokens();
        throw error;
      })
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  // ============================================================================
  // METODY PUBLICZNE
  // ============================================================================
  
  // Autoryzacja
  async register(userData) {
      const data = await this.request('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data?.tokens || data?.access || data?.refresh || data?.access_token || data?.refresh_token) {
        setTokens({
          access:  data.tokens?.access  ?? data.access  ?? data.access_token,
          refresh: data.tokens?.refresh ?? data.refresh ?? data.refresh_token,
          user:    data.user
        });
      }
      return data;
  }

  async login(credentials) {
    const data = await this.request('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data?.tokens || data?.access || data?.refresh || data?.access_token || data?.refresh_token) {
        setTokens({
          access:  data.tokens?.access  ?? data.access  ?? data.access_token,
          refresh: data.tokens?.refresh ?? data.refresh ?? data.refresh_token,
          user:    data.user
        });
      }
      return data;
  }

  async logout() {
    return this.request('/api/auth/logout/', {
      method: 'POST',
    });
  }

  // Profil
  async fetchUserProfile() {
    return this.request('/api/auth/profile/');
  }

  async updateUserProfile(profileData) {
    return this.request('/api/auth/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Rekomendacje
  async generateRecommendations(method = 'hybrid', preferences = {}) {
    return this.request('/api/recommendations/', {
      method: 'POST',
      body: JSON.stringify({
        mode: method,
        preferences,
        top: 3,
      }),
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.request('/health/');
      return response.status === 'ok';
    } catch (error) {
      console.error('❌ [ApiService] Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
const apiService = new ApiService();
export default apiService;

// Export głównych metod dla wygody
export const {
  register,
  login,
  logout,
  fetchUserProfile,
  updateUserProfile,
  generateRecommendations,
  healthCheck
} = apiService;