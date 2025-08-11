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
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async register(userData) {
    return this.request('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        username: userData.username || userData.name,
        email: userData.email,
        password: userData.password,
        password_confirm: userData.password,
        first_name: userData.name,
        date_of_birth: userData.birthDate,
        goal: userData.goal,
        level: userData.level,
        training_days_per_week: userData.trainingDaysPerWeek,
        equipment_preference: userData.equipmentPreference,
      }),
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
