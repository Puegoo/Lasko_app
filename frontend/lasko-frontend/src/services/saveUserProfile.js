// frontend/lasko-frontend/src/services/saveUserProfile.js
import { api } from './apiClient'; // Poprawiony import - używamy named export

/**
 * Zapisuje lub aktualizuje profil użytkownika
 * @param {Object} userData - Dane profilu do zapisania
 * @returns {Promise<Object>} - Odpowiedź z serwera
 */
const saveUserProfile = async (userData) => {
  try {
    console.log('📤 [saveUserProfile] Otrzymane dane:', userData);
    
    // Mapuj dane z frontendu na format backendu
    const payload = {};
    
    // Podstawowe dane
    if (userData.first_name !== undefined) {
      payload.first_name = userData.first_name;
    }
    
    if (userData.date_of_birth !== undefined) {
      payload.date_of_birth = userData.date_of_birth;
    }
    
    // Parametry treningowe - TYLKO jeśli są faktycznie ustawione
    if (userData.goal && userData.goal !== '') {
      payload.goal = userData.goal;
    }
    
    if (userData.level && userData.level !== '') {
      payload.level = userData.level;
    }
    
    // Obsłuż różne nazwy dla dni treningowych
    const trainingDays = userData.training_days_per_week || userData.trainingDaysPerWeek || userData.trainingDays;
    if (trainingDays !== undefined && trainingDays !== null && trainingDays !== '') {
      payload.training_days_per_week = parseInt(trainingDays, 10);
    }
    
    // Obsłuż różne nazwy dla equipment
    const equipment = userData.equipment_preference || userData.equipmentPreference || userData.equipment;
    if (equipment && equipment !== '') {
      payload.equipment_preference = equipment;
    }
    
    // Czas sesji
    const sessionDuration = userData.preferred_session_duration || userData.preferredSessionDuration || userData.sessionDuration || userData.time_per_session;
    if (sessionDuration !== undefined && sessionDuration !== null && sessionDuration !== '') {
      payload.preferred_session_duration = parseInt(sessionDuration, 10);
    }
    
    // Preferencje - tablice
    if (userData.avoid_exercises !== undefined) {
      payload.avoid_exercises = Array.isArray(userData.avoid_exercises) 
        ? userData.avoid_exercises 
        : [];
    } else if (userData.avoidances !== undefined) {
      payload.avoid_exercises = Array.isArray(userData.avoidances) 
        ? userData.avoidances 
        : [];
    }
    
    if (userData.focus_areas !== undefined) {
      payload.focus_areas = Array.isArray(userData.focus_areas) 
        ? userData.focus_areas 
        : [];
    } else if (userData.focusAreas !== undefined) {
      payload.focus_areas = Array.isArray(userData.focusAreas) 
        ? userData.focusAreas 
        : [];
    }
    
    // Metoda rekomendacji
    if (userData.recommendation_method !== undefined && userData.recommendation_method !== '') {
      payload.recommendation_method = userData.recommendation_method;
    } else if (userData.recommendationMethod !== undefined && userData.recommendationMethod !== '') {
      payload.recommendation_method = userData.recommendationMethod;
    }
    
    // Sprawdź czy są jakieś dane do wysłania
    if (Object.keys(payload).length === 0) {
      console.log('⚠️ [saveUserProfile] Brak danych do wysłania');
      return { 
        success: true, 
        message: 'Brak danych do aktualizacji',
        profile: {} 
      };
    }
    
    console.log('📤 [saveUserProfile] Wysyłanie danych do API:', payload);
    
    // Pobierz token z localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Brak tokenu autoryzacji. Zaloguj się ponownie.');
    }
    
    // Wyślij żądanie aktualizacji profilu z tokenem
    const response = await api.put('/api/auth/profile/update/', payload, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ [saveUserProfile] Profil zaktualizowany pomyślnie:', response.data);
    
    return {
      success: true,
      ...response.data
    };
    
  } catch (error) {
    console.error('❌ [saveUserProfile] Błąd podczas zapisywania profilu:', error);
    
    // Bardziej szczegółowa obsługa błędów
    if (error.response) {
      // Błąd z odpowiedzią serwera
      const errorData = error.response.data;
      console.error('❌ [saveUserProfile] Szczegóły błędu serwera:', errorData);
      
      if (error.response.status === 401) {
        // Błąd autoryzacji
        throw new Error('Sesja wygasła. Zaloguj się ponownie.');
      } else if (errorData.errors) {
        // Błędy walidacji
        const errorMessages = Object.entries(errorData.errors)
          .map(([field, messages]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(', ')}`;
          })
          .join('; ');
        throw new Error(`Błędy walidacji: ${errorMessages}`);
      } else if (errorData.detail) {
        throw new Error(errorData.detail);
      } else if (errorData.message) {
        throw new Error(errorData.message);
      }
    } else if (error.request) {
      // Brak odpowiedzi z serwera
      throw new Error('Brak odpowiedzi z serwera. Sprawdź połączenie.');
    }
    
    // Przekaż błąd dalej
    throw error;
  }
};

export default saveUserProfile;