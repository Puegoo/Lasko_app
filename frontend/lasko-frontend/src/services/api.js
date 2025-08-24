// frontend/lasko-frontend/src/services/api.js (POPRAWIONE Z NOWYMI METODAMI)
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

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
      if (config.body) {
        console.log('📤 Request payload:', JSON.parse(config.body));
      }

      const response = await fetch(url, config);
      
      console.log(`📥 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        console.log('❌ Error response data:', errorData);
        
        // Ulepszona obsługa błędów walidacji
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
          
          console.log('🔄 Processed validation errors:', errorMessages);
          
          const error = new Error(errorMessages.join('\n'));
          error.validationErrors = errorData.errors;
          error.field = Object.keys(errorData.errors)[0];
          
          console.log('🚨 Throwing validation error:', {
            message: error.message,
            validationErrors: error.validationErrors,
            field: error.field
          });
          
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
    console.log('🔍 ApiService - Otrzymane dane do rejestracji:');
    console.log('='.repeat(50));
    console.log('📝 Oryginalne dane:', userData);
    
    // Przygotuj dane do wysłania - zachowaj oryginalne nazwy pól
    const registrationData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      password_confirm: userData.password,
      first_name: userData.name,
      date_of_birth: userData.birthDate,
      goal: userData.goal || '',
      level: userData.level || '',
      training_days_per_week: userData.trainingDaysPerWeek || 3,
      equipment_preference: userData.equipmentPreference || ''
    };

    console.log('🔧 Debug - Sprawdzenie każdego pola:');
    console.log('   username:', `"${registrationData.username}"`);
    console.log('   email:', `"${registrationData.email}"`);
    console.log('   password length:', registrationData.password?.length || 0);
    console.log('   first_name:', `"${registrationData.first_name}"`);
    console.log('   date_of_birth:', `"${registrationData.date_of_birth}"`);
    console.log('   goal:', `"${registrationData.goal}"`);
    console.log('   level:', `"${registrationData.level}"`);
    console.log('   training_days_per_week:', registrationData.training_days_per_week);
    console.log('   equipment_preference:', `"${registrationData.equipment_preference}"`);
    console.log('='.repeat(50));

    return this.request('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  async login(credentials) {
    const response = await this.request('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({
        login: credentials.email,
        password: credentials.password,
      }),
    });

    if (response.tokens) {
      localStorage.setItem('access_token', response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  }

  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  // ============================================================================
  // NOWE METODY DLA REKOMENDACJI - używają this.request() dla spójności
  // ============================================================================

  async setRecommendationMethod(method) {
    console.log('🎯 ApiService: Ustawianie metody rekomendacji:', method);
    
    if (!['product', 'user', 'hybrid'].includes(method)) {
      throw new Error('Nieprawidłowa metoda rekomendacji. Dozwolone: product, user, hybrid');
    }

    return this.request('/api/auth/set-recommendation-method/', {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  }

  async generateRecommendations(method) {
    console.log('🤖 ApiService: Generowanie rekomendacji metodą:', method);
    
    return this.request('/api/auth/generate-recommendations/', {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  }
}

const apiService = new ApiService();
export default apiService;