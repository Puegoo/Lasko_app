// frontend/lasko-frontend/src/services/recommendationService.js
import { getAccessToken } from './authService';

// prosta dekodacja JWT, żeby wyciągnąć userId
function getCurrentUserIdFromToken() {
  try {
    const t = getAccessToken();
    if (!t) return null;
    const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.user_id ?? payload.userId ?? payload.sub ?? null;
  } catch {
    return null;
  }
}

export class RecommendationService {
  constructor(baseURL = '') {
    this.baseURL = (baseURL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  }

  _headers() {
    const token = getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // BACKEND: POST /api/recommendations/
  // { userId, mode: 'hybrydowo'|'produktowo'|'klientowo', preferences: {...}, top }
  async getRecommendations({ mode = 'hybrid', top = 3, preferences = {}, userId } = {}) {
    const body = {
      userId: userId ?? getCurrentUserIdFromToken(),
      mode,
      preferences,
      top,
    };

    const res = await fetch(`${this.baseURL}/api/recommendations/`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body),
    });

    if (res.status === 401) throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    if (!res.ok) throw new Error('Nie udało się pobrać rekomendacji.');
    return await res.json(); // { recommendations: [...] }
  }

  async getPlanDetailed(planId, { signal } = {}) {
      const id = encodeURIComponent(planId);
      const base = this.baseURL || '';
      const url = `${base}/api/recommendations/plans/${id}/detailed/`;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📡 [RecommendationService] getPlanDetailed START');
      console.log('   Plan ID:', planId);
      console.log('   Encoded ID:', id);
      console.log('   Full URL:', url);
      console.log('   Headers:', this._headers());
      
      const r = await fetch(url, { method: 'GET', headers: this._headers(), signal });
      
      console.log('   Response Status:', r.status);
      console.log('   Response OK:', r.ok);
      console.log('   Response Headers:', Object.fromEntries(r.headers.entries()));
      
      if (r.status === 401) {
        console.error('❌ [RecommendationService] 401 - Brak autoryzacji');
        throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
      }
      if (!r.ok) {
        console.error('❌ [RecommendationService] Response not OK:', r.status, r.statusText);
        throw new Error('Nie udało się pobrać szczegółów planu.');
      }
      
      const data = await r.json();
      console.log('✅ [RecommendationService] Response Data:', data);
      console.log('   Type of data:', typeof data);
      console.log('   Is Array:', Array.isArray(data));
      console.log('   Keys:', Object.keys(data || {}));
      
      if (data.plan) {
        console.log('   data.plan exists:', data.plan);
        console.log('   data.plan.days:', data.plan.days);
        console.log('   Type of data.plan.days:', typeof data.plan.days);
        console.log('   Is Array data.plan.days:', Array.isArray(data.plan.days));
      }
      
      if (data.days) {
        console.log('   data.days exists:', data.days);
        console.log('   Type of data.days:', typeof data.days);
        console.log('   Is Array data.days:', Array.isArray(data.days));
      }
      
      console.log('📡 [RecommendationService] getPlanDetailed END');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return data;
    }

  async getActivePlan() {
    const res = await fetch(`${this.baseURL}/api/recommendations/active-plan/`, {
      method: 'GET',
      headers: this._headers(),
    });
    if (res.status === 401) throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    if (!res.ok) throw new Error('Nie udało się pobrać aktywnego planu.');
    return await res.json();
  }

  async activatePlan(planId, isCustomPlan = false, customPlanId = null) {
    const body = {};
    if (isCustomPlan && customPlanId) {
      body.isCustomPlan = true;
      body.customPlanId = customPlanId;
    } else {
      // Dla standardowych planów ustawiamy explicite false
      body.isCustomPlan = false;
    }
    
    console.log('[RecommendationService] activatePlan:', { planId, isCustomPlan, customPlanId, body });
    
    const headers = this._headers();
    // Upewnij się że Content-Type jest ustawiony
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    const res = await fetch(`${this.baseURL}/api/recommendations/plans/${encodeURIComponent(planId)}/activate/`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body), // Zawsze wysyłaj JSON, nawet jeśli pusty
    });
    
    console.log('[RecommendationService] activatePlan response status:', res.status);
    
    if (res.status === 401) throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[RecommendationService] activatePlan error:', errorData);
      throw new Error(errorData.error || errorData.message || 'Nie udało się aktywować planu.');
    }
    return await res.json();
  }

  async createCustomPlan(body) {
    const res = await fetch(`${this.baseURL}/api/plans`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    if (!res.ok) throw new Error('Nie udało się utworzyć planu.');
    return await res.json();
  }

  // 🆕 REKOMENDACJE ĆWICZEŃ
  async getRecommendedExercises({ 
    preferences = {}, 
    limit = 50, 
    muscleGroup,
    selected_exercises = [],
    current_day_muscle_groups = [],
    week_muscle_groups = []
  } = {}) {
    const body = {
      preferences,
      limit,
      muscle_group: muscleGroup,
      selected_exercises,
      current_day_muscle_groups,
      week_muscle_groups
    };
    
    const res = await fetch(`${this.baseURL}/api/recommendations/exercises/`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    if (!res.ok) throw new Error('Nie udało się pobrać rekomendacji ćwiczeń.');
    return await res.json();
  }

  // 🆕 CUSTOM PLANY
  async createCustomPlanFromExercises(planData) {
    const res = await fetch(`${this.baseURL}/api/recommendations/custom-plans/`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(planData),
    });
    if (res.status === 401) throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('[RecommendationService] Error creating custom plan:', error);
      console.error('[RecommendationService] Plan data sent:', planData);
      throw new Error(error.message || error.error || 'Nie udało się utworzyć custom planu.');
    }
    return await res.json();
  }

  async getUserCustomPlans() {
    const res = await fetch(`${this.baseURL}/api/recommendations/custom-plans/`, {
      method: 'GET',
      headers: this._headers(),
    });
    if (res.status === 401) throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    if (!res.ok) throw new Error('Nie udało się pobrać custom planów.');
    return await res.json();
  }

  async getCustomPlan(planId) {
    const url = `${this.baseURL}/api/recommendations/custom-plans/${encodeURIComponent(planId)}/`;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [RecommendationService] getCustomPlan START');
    console.log('   Plan ID:', planId);
    console.log('   Full URL:', url);
    console.log('   Headers:', this._headers());

    const res = await fetch(url, {
      method: 'GET',
      headers: this._headers(),
    });

    console.log('   Response Status:', res.status);
    console.log('   Response OK:', res.ok);

    if (res.status === 401) {
      console.error('❌ [RecommendationService] 401 - Brak autoryzacji (getCustomPlan)');
      throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.error('❌ [RecommendationService] getCustomPlan error response:', error);
      throw new Error(error.message || error.error || 'Nie udało się pobrać custom planu.');
    }

    const data = await res.json();
    console.log('✅ [RecommendationService] getCustomPlan data:', data);
    if (data.plan) {
      console.log('   data.plan.days:', data.plan.days);
      console.log('   Type of data.plan.days:', typeof data.plan.days);
      console.log('   Is Array data.plan.days:', Array.isArray(data.plan.days));
      if (Array.isArray(data.plan.days)) {
        console.log('   Length of data.plan.days:', data.plan.days.length);
        console.log('   Exercises per day:', data.plan.days.map((d) => ({
          name: d.name,
          exercisesCount: Array.isArray(d.exercises) ? d.exercises.length : 'not-array',
        })));
      }
    }
    console.log('📡 [RecommendationService] getCustomPlan END');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return data;
  }

  async updateCustomPlan(planId, planData) {
    const res = await fetch(`${this.baseURL}/api/recommendations/custom-plans/${encodeURIComponent(planId)}/update/`, {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(planData),
    });
    if (res.status === 401) throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Nie udało się zaktualizować custom planu.');
    }
    return await res.json();
  }
}

export default null;