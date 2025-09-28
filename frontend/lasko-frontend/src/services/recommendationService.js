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
      const tryFetch = async (url) => {
        const r = await fetch(url, { method: 'GET', headers: this._headers(), signal });
        return r.ok ? r.json() : null;
      };
      const id = encodeURIComponent(planId);
      const base = this.baseURL || '';
      const out =
        (await tryFetch(`${base}/api/plans/${id}/detailed`)) ||
        (await tryFetch(`${base}/api/recommendations/plan/${id}/detailed`)) ||
        null;
      if (!out) throw new Error('Nie udało się pobrać szczegółów planu.');
      return out;
    }

  async activatePlan(planId) {
    const res = await fetch(`${this.baseURL}/api/plans/${encodeURIComponent(planId)}/activate`, {
      method: 'POST',
      headers: this._headers(),
    });
    if (res.status === 401) throw new Error('Brak tokenu autoryzacji - zaloguj się ponownie');
    if (!res.ok) throw new Error('Nie udało się aktywować planu.');
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
}

export default null;