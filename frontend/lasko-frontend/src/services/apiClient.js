// frontend/lasko-frontend/src/services/apiClient.js
// Minimalny klient oparty o fetch
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class APIClient {
  constructor() {
    this.baseURL = BASE_URL;
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseURL}/`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export default APIClient;
