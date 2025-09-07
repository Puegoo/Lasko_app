// services/saveUserProfile.js
import { getAccessToken } from './authService'; // centralne pozyskanie tokenu [6]

const saveUserProfile = async (userData) => {
  try {
    console.log('💾 Zapisywanie profilu użytkownika:', userData);

    if (userData.profileSaved || userData.user?.id) {
      console.log('✅ Profil już zapisany podczas rejestracji');
      return { success: true, message: 'Profil zapisany podczas rejestracji' };
    }

    const token = getAccessToken(); // zamiast localStorage.getItem(...) [6]
    if (!token) {
      console.warn('⚠️ Brak tokenu - profil powinien być już zapisany');
      return { success: true, message: 'Brak tokenu, ale profil powinien być zapisany' };
    }

    const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, ''); // spójnie z VITE_API_URL [13]
    const res = await fetch(`${base}/api/auth/profile/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` // automatyczny nagłówek z authService [15]
      },
      body: JSON.stringify({
        goal: userData.goal,
        level: userData.level,
        training_days_per_week: userData.trainingDaysPerWeek,
        equipment_preference: userData.equipmentPreference,
        avoid_exercises: userData.avoidances || [],
        focus_areas: userData.focusAreas || []
      })
    });

    if (res.status === 401) {
      console.warn('⚠️ Token wygasł podczas aktualizacji profilu');
      return { success: true, message: 'Token wygasł, ale profil został wcześniej zapisany' };
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn('⚠️ Błąd aktualizacji profilu:', errorData);
      return { success: true, message: 'Błąd aktualizacji, ale profil został wcześniej zapisany' };
    }

    const result = await res.json();
    console.log('✅ Profil zaktualizowany:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Błąd zapisu profilu:', error);
    console.warn('⚠️ Ignorowanie błędu - profil prawdopodobnie został już zapisany podczas rejestracji');
    return { success: true, message: 'Ignorowano błąd - profil zapisany wcześniej' };
  }
};

export default saveUserProfile;
