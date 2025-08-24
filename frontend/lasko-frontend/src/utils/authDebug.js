// frontend/lasko-frontend/src/utils/authDebug.js
/**
 * Narzędzia do debugowania problemów z autoryzacją
 */

export const AuthDebug = {
    /**
     * Sprawdź stan localStorage z tokenami
     */
    checkTokens() {
      console.log('🔍 SPRAWDZANIE STANU TOKENÓW:');
      console.log('=' .repeat(40));
      
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      
      console.log('📝 Access Token:', accessToken ? 'OBECNY' : '❌ BRAK');
      console.log('📝 Refresh Token:', refreshToken ? 'OBECNY' : '❌ BRAK');
      
      if (accessToken) {
        try {
          // Spróbuj zdekodować JWT (base64)
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          console.log('📋 Token Payload:', payload);
          console.log('📅 Expires:', new Date(payload.exp * 1000));
          console.log('⏰ Is Expired:', payload.exp * 1000 < Date.now());
        } catch (e) {
          console.log('❌ Nie można zdekodować tokenu:', e.message);
        }
      }
      
      return { accessToken, refreshToken };
    },
  
    /**
     * Test prostego API call z obecnym tokenem
     */
    async testApiCall() {
      console.log('\n🧪 TEST API CALL Z TOKENEM:');
      console.log('=' .repeat(40));
      
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        console.log('❌ Brak tokenu - nie można testować');
        return false;
      }
      
      try {
        const response = await fetch('http://localhost:8000/api/auth/profile/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Response Status:', response.status);
        console.log('📋 Response Headers:');
        response.headers.forEach((value, key) => {
          console.log(`   ${key}: ${value}`);
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API Response OK:', data);
          return true;
        } else {
          const errorData = await response.json();
          console.log('❌ API Error:', errorData);
          return false;
        }
      } catch (error) {
        console.log('❌ Network Error:', error);
        return false;
      }
    },
  
    /**
     * Wyczyść wszystkie tokeny i stan autoryzacji
     */
    clearAuth() {
      console.log('🗑️ CZYSZCZENIE STANU AUTORYZACJI:');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      console.log('✅ Tokeny usunięte z localStorage');
    },
  
    /**
     * Sprawdź format tokenu JWT
     */
    validateJWTFormat(token) {
      if (!token) return { valid: false, reason: 'Token is null/undefined' };
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, reason: 'JWT should have 3 parts separated by dots' };
      }
      
      try {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        return {
          valid: true,
          header,
          payload,
          isExpired: payload.exp * 1000 < Date.now()
        };
      } catch (error) {
        return { valid: false, reason: `Cannot decode JWT: ${error.message}` };
      }
    }
  };
  
  // Dodaj do window dla łatwego dostępu w konsoli przeglądarki
  if (typeof window !== 'undefined') {
    window.AuthDebug = AuthDebug;
  }
  
  // frontend/lasko-frontend/src/services/api.js - POPRAWIONA WERSJA
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  class ApiService {
    constructor() {
      this.baseURL = API_BASE_URL;
    }
  
    async request(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };
  
      // 🚨 DEBUGOWANIE TOKENÓW
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('🔐 Adding Authorization header with token');
        config.headers.Authorization = `Bearer ${token}`;
        
        // Sprawdź czy token nie wygasł
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          if (isExpired) {
            console.warn('⚠️ Token wygasł!', {
              expires: new Date(payload.exp * 1000),
              now: new Date()
            });
          }
        } catch (e) {
          console.warn('⚠️ Nie można sprawdzić wygaśnięcia tokenu:', e);
        }
      } else {
        console.log('⚠️ Brak tokenu Authorization - żądanie bez uwierzytelniania');
      }
  
      try {
        console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
        console.log('📋 Request headers:', config.headers);
        
        if (config.body) {
          console.log('📤 Request payload:', JSON.parse(config.body));
        }
  
        const response = await fetch(url, config);
        
        console.log(`📥 Response status: ${response.status} ${response.statusText}`);
        console.log('📋 Response headers:');
        response.headers.forEach((value, key) => {
          console.log(`   ${key}: ${value}`);
        });
        
        if (!response.ok) {
          // 🚨 SZCZEGÓŁOWA OBSŁUGA BŁĘDU 401
          if (response.status === 401) {
            console.error('🚨 BŁĄD 401 - UNAUTHORIZED');
            console.error('Token w localStorage:', !!localStorage.getItem('access_token'));
            console.error('Authorization header:', config.headers.Authorization);
            
            // Wyczyść tokeny przy 401
            this.logout();
            
            throw new Error('Sesja wygasła. Zaloguj się ponownie.');
          }
          
          const errorData = await response.json();
          console.log('❌ Error response data:', errorData);
          
          // Standardowa obsługa błędów walidacji
          if (errorData.errors && typeof errorData.errors === 'object') {
            const errorMessages = [];
            
            Object.entries(errorData.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                messages.forEach(message => {
                  errorMessages.push(`${field}: ${message}`);
                });
              } else {
                errorMessages.push(`${field}: ${messages}`);
              }
            });
            
            const error = new Error(errorMessages.join('\n'));
            error.validationErrors = errorData.errors;
            error.field = Object.keys(errorData.errors)[0];
            throw error;
          }
          
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
  
        const responseData = await response.json();
        console.log('✅ Success response:', responseData);
        return responseData;
      } catch (error) {
        console.error('🚨 API Request failed:', error);
        throw error;
      }
    }
  
    async register(userData) {
      console.log('🔍 ApiService - Rejestracja użytkownika');
      
      const response = await this.request('/api/auth/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
  
      // 🚨 ZAPISZ TOKENY PO UDANEJ REJESTRACJI
      if (response.tokens) {
        console.log('💾 Zapisywanie tokenów po rejestracji');
        localStorage.setItem('access_token', response.tokens.access);
        localStorage.setItem('refresh_token', response.tokens.refresh);
        console.log('✅ Tokeny zapisane w localStorage');
      } else {
        console.warn('⚠️ Brak tokenów w odpowiedzi rejestracji!', response);
      }
  
      return response;
    }
  
    async login(credentials) {
      const response = await this.request('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({
          login: credentials.email,
          password: credentials.password,
        }),
      });
  
      // 🚨 ZAPISZ TOKENY PO UDANYM LOGOWANIU
      if (response.tokens) {
        console.log('💾 Zapisywanie tokenów po logowaniu');
        localStorage.setItem('access_token', response.tokens.access);
        localStorage.setItem('refresh_token', response.tokens.refresh);
        console.log('✅ Tokeny zapisane w localStorage');
      } else {
        console.warn('⚠️ Brak tokenów w odpowiedzi logowania!', response);
      }
  
      return response;
    }
  
    async getProfile() {
      return this.request('/api/auth/profile/', {
        method: 'GET',
      });
    }
  
    async updateProfile(profileData) {
      return this.request('/api/auth/profile/', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    }
  
    logout() {
      console.log('🔐 Wylogowanie - usuwanie tokenów');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  
    isAuthenticated() {
      const token = localStorage.getItem('access_token');
      if (!token) return false;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        return !isExpired;
      } catch (e) {
        return false;
      }
    }
  
    getAccessToken() {
      return localStorage.getItem('access_token');
    }
  }
  
  const apiService = new ApiService();
  export default apiService;