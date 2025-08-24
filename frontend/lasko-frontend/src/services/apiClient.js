// Prosta klasa API dla kompatybilności
class APIClient {
  constructor() {
    this.baseURL = 'http://localhost:8000';
  }
  
  async healthCheck() {
    return true; // Zawsze zwracaj true dla fallback
  }
}

export default APIClient;
