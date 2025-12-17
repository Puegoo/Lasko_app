import apiService from './api';
import { getAccessToken } from './authService';

const buildQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return '';
  const query = new URLSearchParams();
  for (const [key, value] of entries) {
    query.append(key, value);
  }
  return `?${query.toString()}`;
};

const adminApi = {
  // Dashboard
  async getDashboardSummary() {
    return apiService.request('/api/admin/dashboard/summary/');
  },
  async getRecommendationStats() {
    return apiService.request('/api/admin/recommendations/stats/');
  },
  async getRecommendationLogs(params) {
    return apiService.request(`/api/admin/recommendations/logs/${buildQueryString(params)}`);
  },

  // Users
  async getUsers(params) {
    return apiService.request(`/api/admin/users/${buildQueryString(params)}`);
  },
  async getUser(userId) {
    return apiService.request(`/api/admin/users/${userId}/`);
  },
  async updateUserStatus(userId, payload) {
    return apiService.request(`/api/admin/users/${userId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  async resetUserPassword(userId, newPassword = 'password123') {
    return apiService.request(`/api/admin/users/${userId}/reset-password/`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });
  },

  // Exercises
  async getExercises(params) {
    return apiService.request(`/api/admin/exercises/${buildQueryString(params)}`);
  },
  async createExercise(payload) {
    return apiService.request('/api/admin/exercises/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateExercise(exerciseId, payload) {
    return apiService.request(`/api/admin/exercises/${exerciseId}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  async deleteExercise(exerciseId) {
    return apiService.request(`/api/admin/exercises/${exerciseId}/`, {
      method: 'DELETE',
    });
  },

  // Plans
  async getPlans(params) {
    return apiService.request(`/api/admin/plans/${buildQueryString(params)}`);
  },
  async getPlan(planId) {
    return apiService.request(`/api/admin/plans/${planId}/`);
  },
  async updatePlan(planId, payload) {
    return apiService.request(`/api/admin/plans/${planId}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // CSV exports - helper function to download CSV
  async _downloadCsv(endpoint, filename) {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Brak tokenu autoryzacji');
      }

      // Użyj tego samego base URL co apiService (pusty string = używa proxy Vite)
      const baseURL = '';
      const url = `${baseURL}${endpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Błąd pobierania pliku' }));
        throw new Error(errorData.detail || 'Błąd pobierania pliku');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('[adminApi] Błąd eksportu CSV:', error);
      throw error;
    }
  },

  async exportUsersCsv() {
    await this._downloadCsv('/api/admin/users/export/', 'users.csv');
  },
  async exportExercisesCsv() {
    await this._downloadCsv('/api/admin/exercises/export/', 'exercises.csv');
  },
  async exportPlansCsv() {
    await this._downloadCsv('/api/admin/plans/export/', 'training_plans.csv');
  },

  // Statistics
  async getTrainingStatistics() {
    return apiService.request('/api/admin/statistics/training/');
  },
  async getUserActivityStatistics() {
    return apiService.request('/api/admin/statistics/user-activity/');
  },
};

export default adminApi;




