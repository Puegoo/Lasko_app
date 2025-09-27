// services/saveUserProfile.js
import apiService from './api';

const saveUserProfile = async (userData) => {
  console.log('💾 Zapisywanie profilu użytkownika (via apiService):', userData);
  // używamy warstwy z auto-refresh
  const payload = {
    goal: userData.goal,
    level: userData.level,
    training_days_per_week: userData.trainingDaysPerWeek,
    equipment_preference: userData.equipmentPreference || userData.equipment,
    avoid_exercises: userData.avoidances || [],
    focus_areas: userData.focusAreas || []
  };
  const result = await apiService.updateUserProfile(payload); // → /api/auth/profile/update/
  console.log('✅ Profil zaktualizowany:', result);
  return { success: true, result };
};

export default saveUserProfile