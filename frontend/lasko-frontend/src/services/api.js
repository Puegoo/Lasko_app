const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Funkcja do bezpiecznego generowania username
  generateUsername(name) {
    if (!name) return '';
    
    // Mapowanie polskich znaków na odpowiedniki bez diakrytyków
    const polishCharsMap = {
      'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 
      'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
      'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
      'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };
    
    const result = name
      .split('')
      .map(char => polishCharsMap[char] || char)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 30);
    
    console.log(`🔄 Username generation: "${name}" -> "${result}"`);
    return result;
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
    console.log('   name:', `"${userData.name}"`);
    console.log('   email:', `"${userData.email}"`);
    console.log('   goal:', `"${userData.goal}"`);
    console.log('   level:', `"${userData.level}"`);
    console.log('   trainingDaysPerWeek:', userData.trainingDaysPerWeek);
    console.log('   equipmentPreference:', `"${userData.equipmentPreference}"`);
    
    // Przygotuj dane z poprawnym mapowaniem i dodaj password_confirm
    const registrationData = {
      username: this.generateUsername(userData.name || userData.username),
      email: userData.email,
      password: userData.password,
      password_confirm: userData.password, // WAŻNE: Dodaj to pole!
      first_name: userData.name || userData.first_name,
      date_of_birth: userData.birthDate || userData.date_of_birth || null,
      goal: userData.goal || '',
      level: userData.level || '',
      training_days_per_week: userData.trainingDaysPerWeek || userData.training_days_per_week || null,
      equipment_preference: userData.equipmentPreference || userData.equipment_preference || '',
    };

    console.log('🔄 ApiService - Dane po mapowaniu (wysyłane do backendu):');
    console.log('   username:', `"${registrationData.username}"`);
    console.log('   email:', `"${registrationData.email}"`);
    console.log('   first_name:', `"${registrationData.first_name}"`);
    console.log('   date_of_birth:', registrationData.date_of_birth);
    console.log('   goal:', `"${registrationData.goal}"`);
    console.log('   level:', `"${registrationData.level}"`);
    console.log('   training_days_per_week:', registrationData.training_days_per_week);
    console.log('   equipment_preference:', `"${registrationData.equipment_preference}"`);
    console.log('   password_confirm:', registrationData.password_confirm ? 'PRESENT' : 'MISSING');
    console.log('📦 Pełny payload do backendu:', registrationData);
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
}

const apiService = new ApiService();
export default apiService;