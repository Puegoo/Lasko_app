import apiService from './api';

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

  // CSV exports
  exportUsersCsv() {
    window.open('/api/admin/users/export/', '_blank', 'noopener');
  },
  exportExercisesCsv() {
    window.open('/api/admin/exercises/export/', '_blank', 'noopener');
  },
  exportPlansCsv() {
    window.open('/api/admin/plans/export/', '_blank', 'noopener');
  },
};

export default adminApi;




