// frontend/lasko-frontend/src/services/recommendationService.js

/**
 * Serwis do komunikacji z API rekomendacji
 */

const API_BASE = '/api';

// Pobierz token z localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

/**
 * Pobiera rekomendacje planów dla zalogowanego użytkownika
 * @param {string} mode - Tryb rekomendacji: 'produkt', 'klient', 'hybrydowo'
 * @param {number} limit - Liczba rekomendacji do pobrania
 * @returns {Promise<Object>} Odpowiedź z rekomendacjami
 */
export const getRecommendations = async (mode = 'hybrydowo', limit = 5) => {
  try {
    const response = await fetch(
      `${API_BASE}/recommendations/get/?mode=${mode}&limit=${limit}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd podczas pobierania rekomendacji');
    }

    return await response.json();
  } catch (error) {
    console.error('Błąd API rekomendacji:', error);
    throw error;
  }
};

/**
 * Pobiera profil użytkownika wraz z rekomendacjami
 * @returns {Promise<Object>} Profil użytkownika i top rekomendacje
 */
export const getUserProfileAndRecommendations = async () => {
  try {
    const response = await fetch(`${API_BASE}/recommendations/profile/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd podczas pobierania profilu');
    }

    return await response.json();
  } catch (error) {
    console.error('Błąd API profilu:', error);
    throw error;
  }
};

/**
 * Symulacja algorytmu dla przypadków offline/demo
 * Używane tylko gdy backend nie jest dostępny
 */
export const getFallbackRecommendations = (userProfile) => {
  // Podstawowe rekomendacje fallback
  const fallbackPlans = [
    {
      id: 1,
      name: "Plan dla początkujących",
      description: "Idealny start Twojej przygody z treningiem",
      compatibility: 85,
      matchReasons: ["Dopasowany do Twojego poziomu"],
      goal: userProfile.goal || 'masa',
      level: 'początkujący',
      daysPerWeek: 3
    },
    {
      id: 2,
      name: "Full Body Training",
      description: "Kompleksowy trening całego ciała",
      compatibility: 75,
      matchReasons: ["Uniwersalny plan treningowy"],
      goal: userProfile.goal || 'masa',
      level: 'średniozaawansowany',
      daysPerWeek: 4
    }
  ];

  return {
    mode: 'fallback',
    total_found: fallbackPlans.length,
    returned: fallbackPlans.length,
    recommendations: fallbackPlans
  };
};

export default {
  getRecommendations,
  getUserProfileAndRecommendations,
  getFallbackRecommendations
};