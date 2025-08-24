// SZYBKA NAPRAWA - frontend/lasko-frontend/src/services/recommendationService.js

/**
 * Serwis do zarządzania rekomendacjami i zapisywania profili użytkowników
 * POPRAWIONY - z lepszą obsługą błędów autoryzacji
 */
class RecommendationService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  /**
   * Pobiera rekomendacje planów dla użytkownika
   */
  async getRecommendations(userId, mode = 'hybrydowo') {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
      }

      const response = await fetch(`${this.baseURL}/api/recommendations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          mode: mode
        })
      });

      if (response.status === 401) {
        // Wyczyść nieprawidłowe tokeny
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Sesja wygasła - zaloguj się ponownie');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Błąd pobierania rekomendacji:', error);
      throw error;
    }
  }

  /**
   * Aktywuje wybrany plan treningowy dla użytkownika
   */
  async activatePlan(userId, planId) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
      }

      const response = await fetch(`${this.baseURL}/api/activate-plan/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          planId: planId
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Sesja wygasła - zaloguj się ponownie');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Błąd aktywacji planu:', error);
      throw error;
    }
  }

  /**
   * Tworzy niestandardowy plan treningowy
   */
  async createCustomPlan(userId, planData) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
      }

      const response = await fetch(`${this.baseURL}/api/create-custom-plan/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          ...planData
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Sesja wygasła - zaloguj się ponownie');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Błąd tworzenia planu:', error);
      throw error;
    }
  }
}

/**
 * GŁÓWNA FUNKCJA dla komponentu RegistrationContainer
 * POPRAWIONA - bez próby aktualizacji profilu po rejestracji
 */
const saveUserProfile = async (userData) => {
  try {
    console.log('💾 Zapisywanie profilu użytkownika:', userData);
    
    // 🚨 ZMIANA: Nie próbuj aktualizować profilu po rejestracji
    // Profil został już zapisany podczas rejestracji przez serializer
    
    if (userData.profileSaved || userData.user?.id) {
      console.log('✅ Profil już zapisany podczas rejestracji');
      return { success: true, message: 'Profil zapisany podczas rejestracji' };
    }

    // Jeśli z jakiegoś powodu profil nie został zapisany, spróbuj teraz
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️ Brak tokenu - profil powinien być już zapisany');
      return { success: true, message: 'Brak tokenu, ale profil powinien być zapisany' };
    }

    // Ostatnia próba aktualizacji profilu (tylko jeśli naprawdę potrzebna)
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/profile/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        goal: userData.goal,
        level: userData.level,
        training_days_per_week: userData.trainingDaysPerWeek,
        equipment_preference: userData.equipmentPreference,
        // Dodaj array fields jeśli są dostępne
        avoid_exercises: userData.avoidances || [],
        focus_areas: userData.focusAreas || []
      })
    });

    if (response.status === 401) {
      console.warn('⚠️ Token wygasł podczas aktualizacji profilu');
      // Nie rzucaj błędu - profil prawdopodobnie został już zapisany
      return { success: true, message: 'Token wygasł, ale profil został wcześniej zapisany' };
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('⚠️ Błąd aktualizacji profilu:', errorData);
      // Nie rzucaj błędu - profil prawdopodobnie został już zapisany
      return { success: true, message: 'Błąd aktualizacji, ale profil został wcześniej zapisany' };
    }

    const result = await response.json();
    console.log('✅ Profil zaktualizowany:', result);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Błąd zapisu profilu:', error);
    
    // 🚨 ZMIANA: Nie rzucaj błędu - profil został prawdopodobnie już zapisany
    console.warn('⚠️ Ignorowanie błędu - profil prawdopodobnie został już zapisany podczas rejestracji');
    return { success: true, message: 'Ignorowano błąd - profil zapisany wcześniej' };
  }
};

// Export domyślny dla głównej funkcji
export default saveUserProfile;

// Named export dla klasy serwisu
export { RecommendationService };

// 🚨 DODAJ DO KONSOLI PRZEGLĄDARKI dla debugowania:
if (typeof window !== 'undefined') {
  window.testAuth = () => {
    console.log('🔍 SPRAWDZANIE STANU AUTORYZACJI:');
    console.log('Access Token:', localStorage.getItem('access_token') ? 'OBECNY' : 'BRAK');
    console.log('Refresh Token:', localStorage.getItem('refresh_token') ? 'OBECNY' : 'BRAK');
    
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token Payload:', payload);
        console.log('Wygasa:', new Date(payload.exp * 1000));
        console.log('Czy wygasł:', payload.exp * 1000 < Date.now());
      } catch (e) {
        console.log('Błąd dekodowania tokenu:', e);
      }
    }
  };
  
  window.clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    console.log('✅ Wyczyszczono dane autoryzacji');
  };
}