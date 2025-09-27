// src/utils/authDebug.js — WERSJA BEZ ABSOLUTNYCH URLI

export const AuthDebug = {
  // 1) Tokeny
  checkTokens() {
    console.log('%c🔍 SPRAWDZANIE STANU TOKENÓW:', 'color:#4A90E2;font-weight:bold;font-size:14px;');
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userData = localStorage.getItem('user_data');

    console.log('📝 Access Token:', accessToken ? '✅' : '❌');
    console.log('📝 Refresh Token:', refreshToken ? '✅' : '❌');
    console.log('👤 User Data:', userData ? '✅' : '❌');

    if (accessToken) {
      try {
        const p = JSON.parse(atob(accessToken.split('.')[1]));
        const exp = new Date(p.exp * 1000);
        console.log('📋 Payload:', { user_id: p.user_id, username: p.username, exp: p.exp, iat: p.iat });
        console.log('📅 Wygasa:', exp.toLocaleString('pl-PL'), (p.exp * 1000 < Date.now()) ? '❌ (wygasł)' : '✅ (ważny)');
      } catch (e) {
        console.log('❌ Nie można zdekodować tokenu:', e.message);
      }
    }

    if (userData) {
      try {
        const u = JSON.parse(userData);
        console.log('👤 Dane użytkownika:', { id: u.id, username: u.username, email: u.email, first_name: u.first_name });
      } catch {
        console.log('❌ Nieprawidłowe user_data w localStorage');
      }
    }

    return { accessToken, refreshToken, userData };
  },

  // 2) Test API (relatywnie!)
  async testApiCall() {
    console.log('%c🧪 TEST API CALL Z TOKENEM:', 'color:#7ED321;font-weight:bold;font-size:14px;');
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return { success: false, reason: 'Brak tokenu' };

    try {
      const response = await fetch('/api/auth/profile/', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      });

      console.log('📡 Status:', response.status, response.statusText);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ OK:', { user: data.user?.username, hasProfile: !!data.profile });
        return { success: true, data };
      } else {
        const errorData = await response.json().catch(() => null);
        console.log('❌ API Error:', { status: response.status, errorData });
        return { success: false, status: response.status, error: errorData };
      }
    } catch (e) {
      console.log('❌ Network Error:', e.message);
      return { success: false, reason: 'Błąd sieciowy', error: e.message };
    }
  },

  // 3) Pełna diagnostyka
  async fullDiagnostic() {
    console.log('%c🔧 PEŁNA DIAGNOSTYKA AUTORYZACJI:', 'color:#F5A623;font-weight:bold;font-size:16px;');
    const results = {
      timestamp: new Date().toISOString(),
      tokens: this.checkTokens(),
      apiTest: await this.testApiCall(),
      environment: {
        // to tylko info — nie używamy tego do fetcha
        mode: import.meta.env.MODE,
        isDev: import.meta.env.DEV,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href
      }
    };

    const recs = this.generateRecommendations(results);
    recs.forEach((r, i) => console.log(`${i + 1}. ${r}`));
    return { ...results, recommendations: recs };
  },

  // 4) Rekomendacje
  generateRecommendations(r) {
    const out = [];
    if (!r.tokens.accessToken) out.push('❌ Brak access token — zaloguj się.');
    else if (!r.apiTest.success) {
      if (r.apiTest.status === 401) out.push('❌ 401 — token nieważny/wygasł. Wyloguj i zaloguj ponownie.');
      else if (r.apiTest.reason === 'Błąd sieciowy') out.push('❌ Błąd sieci — sprawdź proxy Vite i backend.');
      else out.push(`❌ API błąd ${r.apiTest.status || ''} — sprawdź logi backendu.`);
    }
    if (!r.tokens.refreshToken) out.push('⚠️ Brak refresh token — po wygaśnięciu wymagane ponowne logowanie.');
    if (!r.tokens.userData) out.push('⚠️ Brak user_data — pobierz profil po logowaniu.');
    if (!out.length) out.push('✅ Wygląda dobrze.');
    return out;
  },

  // 5) Walidacja JWT
  validateJWT(token) {
    if (!token) return { valid: false, reason: 'null/undefined' };
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'JWT powinien mieć 3 części' };
    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      console.log('📋 Header:', header);
      console.log('📋 Payload:', payload);
      console.log('⏰ Wygasł:', isExpired ? 'TAK' : 'NIE');
      return { valid: true, header, payload, isExpired };
    } catch (e) {
      return { valid: false, reason: e.message };
    }
  },

  // 6) Czyszczenie
  clearAuth() {
    ['access_token', 'refresh_token', 'user_data', 'token', 'user', 'refreshToken'].forEach(k => localStorage.removeItem(k));
    console.log('🗑️ Wyczyściłem localStorage.');
  },

  // 7) Test logowania (relatywnie!)
  async testLogin(email = 'test@example.com', password = 'test123') {
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password })
      });
      const data = await res.json().catch(() => ({}));
      console.log('📡 Login status:', res.status);
      return res.ok ? { success: true, data } : { success: false, error: data, status: res.status };
    } catch (e) {
      return { success: false, networkError: e.message };
    }
  }
};

if (typeof window !== 'undefined') {
  window.AuthDebug = AuthDebug;
  console.log('🔧 AuthDebug dostępne jako window.AuthDebug');
}

export default AuthDebug;