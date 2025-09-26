// frontend/lasko-frontend/src/utils/authDebug.js - KOMPLETNE NARZĘDZIA DIAGNOSTYCZNE
// Zaawansowane narzędzia do debugowania problemów z autoryzacją

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const AuthDebug = {
  // ============================================================================
  // SPRAWDZANIE STANU TOKENÓW
  // ============================================================================
  checkTokens() {
    console.log('%c🔍 SPRAWDZANIE STANU TOKENÓW:', 'color: #4A90E2; font-weight: bold; font-size: 14px;');
    console.log('='.repeat(60));
    
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userData = localStorage.getItem('user_data');
    
    console.log('📝 Access Token:', accessToken ? '✅ OBECNY' : '❌ BRAK');
    console.log('📝 Refresh Token:', refreshToken ? '✅ OBECNY' : '❌ BRAK');
    console.log('👤 User Data:', userData ? '✅ OBECNY' : '❌ BRAK');
    
    if (accessToken) {
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          const expiryDate = new Date(payload.exp * 1000);
          const timeToExpiry = Math.round((payload.exp * 1000 - Date.now()) / 60000);
          
          console.log('📋 Token Payload:', {
            user_id: payload.user_id,
            username: payload.username,
            exp: payload.exp,
            iat: payload.iat
          });
          console.log('📅 Wygasa:', expiryDate.toLocaleString('pl-PL'));
          console.log('⏰ Status:', isExpired ? '❌ WYGASŁ' : `✅ WAŻNY (${timeToExpiry} min)`);
        } else {
          console.log('❌ Nieprawidłowy format JWT - powinien mieć 3 części');
        }
      } catch (e) {
        console.log('❌ Nie można zdekodować tokenu:', e.message);
      }
    }
    
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        console.log('👤 Dane użytkownika:', {
          id: parsedUserData.id,
          username: parsedUserData.username,
          email: parsedUserData.email,
          first_name: parsedUserData.first_name
        });
      } catch (e) {
        console.log('❌ Nieprawidłowe dane użytkownika w localStorage');
      }
    }
    
    console.log('='.repeat(60));
    return { accessToken, refreshToken, userData };
  },

  // ============================================================================
  // TEST PROSTEGO API CALL
  // ============================================================================
  async testApiCall() {
    console.log('%c🧪 TEST API CALL Z TOKENEM:', 'color: #7ED321; font-weight: bold; font-size: 14px;');
    console.log('='.repeat(60));
    
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
      console.log('❌ Brak tokenu - nie można testować');
      return { success: false, reason: 'Brak tokenu' };
    }
    
    try {
      const testUrl = `${API_BASE_URL}/api/auth/profile/`;
      console.log('🌐 Wysyłanie żądania do:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Status odpowiedzi:', response.status, response.statusText);
      console.log('📋 Nagłówki odpowiedzi:');
      response.headers.forEach((value, key) => {
        console.log(`   ${key}: ${value}`);
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response OK:', {
          user: data.user ? {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email
          } : 'brak danych użytkownika',
          profile: data.profile ? 'obecny' : 'brak'
        });
        return { success: true, data };
      } else {
        const errorData = await response.json().catch(() => null);
        console.log('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        return { success: false, status: response.status, error: errorData };
      }
    } catch (error) {
      console.log('❌ Network Error:', error.message);
      return { success: false, reason: 'Błąd sieciowy', error: error.message };
    }
  },

  // ============================================================================
  // PEŁNA DIAGNOSTYKA SYSTEMU
  // ============================================================================
  async fullDiagnostic() {
    console.log('%c🔧 PEŁNA DIAGNOSTYKA AUTORYZACJI:', 'color: #F5A623; font-weight: bold; font-size: 16px;');
    console.log('='.repeat(60));
    
    const results = {
      timestamp: new Date().toISOString(),
      tokens: {},
      apiTest: {},
      environment: {},
      recommendations: []
    };
    
    // 1. Sprawdź tokeny
    console.log('\n1️⃣ Sprawdzanie tokenów...');
    const tokenCheck = this.checkTokens();
    results.tokens = tokenCheck;
    
    // 2. Test API
    console.log('\n2️⃣ Test API...');
    const apiTest = await this.testApiCall();
    results.apiTest = apiTest;
    
    // 3. Informacje o środowisku
    console.log('\n3️⃣ Środowisko...');
    results.environment = {
      apiBaseUrl: API_BASE_URL,
      mode: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href
    };
    console.log('🌍 API Base URL:', API_BASE_URL);
    console.log('🚀 Tryb:', import.meta.env.MODE);
    console.log('🌐 URL:', window.location.href);
    
    // 4. Rekomendacje
    console.log('\n4️⃣ Analiza i rekomendacje...');
    const recommendations = this.generateRecommendations(results);
    results.recommendations = recommendations;
    
    console.log('\n📋 REKOMENDACJE:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    // 5. Quick fixes
    console.log('\n🔨 SZYBKIE NAPRAWY DOSTĘPNE:');
    console.log('- AuthDebug.clearAuth() - wyczyść wszystkie tokeny');
    console.log('- AuthDebug.testLogin() - test logowania'); 
    console.log('- AuthDebug.validateJWT(token) - walidacja konkretnego tokenu');
    console.log('- AuthDebug.fixCommonIssues() - automatyczne naprawy');
    
    console.log('='.repeat(60));
    return results;
  },

  // ============================================================================
  // GENEROWANIE REKOMENDACJI
  // ============================================================================
  generateRecommendations(diagnosticResults) {
    const recommendations = [];
    
    // Sprawdź tokeny
    if (!diagnosticResults.tokens.accessToken) {
      recommendations.push('❌ Brak access token - wykonaj logowanie');
    } else if (!diagnosticResults.apiTest.success) {
      if (diagnosticResults.apiTest.status === 401) {
        recommendations.push('❌ Token jest nieprawidłowy lub wygasł - wyloguj się i zaloguj ponownie');
      } else if (diagnosticResults.apiTest.status === 404) {
        recommendations.push('❌ Endpoint API nie znaleziony - sprawdź konfigurację API_BASE_URL');
      } else if (diagnosticResults.apiTest.reason === 'Błąd sieciowy') {
        recommendations.push('❌ Problemy z siecią - sprawdź połączenie internetowe i status serwera');
      } else {
        recommendations.push(`❌ Nieznany błąd API (${diagnosticResults.apiTest.status}) - sprawdź logi serwera`);
      }
    }
    
    if (!diagnosticResults.tokens.refreshToken) {
      recommendations.push('⚠️ Brak refresh token - relogowanie będzie wymagane po wygaśnięciu');
    }
    
    if (!diagnosticResults.tokens.userData) {
      recommendations.push('⚠️ Brak danych użytkownika - pobierz profil po zalogowaniu');
    }
    
    // Environment checks
    if (diagnosticResults.environment.apiBaseUrl.includes('localhost')) {
      recommendations.push('🔧 Używasz localhost - upewnij się, że serwer deweloperski działa');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Wszystko wygląda dobrze!');
    }
    
    return recommendations;
  },

  // ============================================================================
  // WALIDACJA JWT
  // ============================================================================
  validateJWT(token) {
    console.log('🔍 WALIDACJA JWT:');
    
    if (!token) {
      console.log('❌ Token jest null/undefined');
      return { valid: false, reason: 'Token is null/undefined' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ JWT powinien mieć 3 części oddzielone kropkami');
      return { valid: false, reason: 'JWT should have 3 parts separated by dots' };
    }
    
    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      console.log('✅ Token ma prawidłowy format');
      console.log('📋 Header:', header);
      console.log('📋 Payload:', {
        user_id: payload.user_id,
        username: payload.username,
        exp: payload.exp,
        iat: payload.iat
      });
      
      const isExpired = payload.exp * 1000 < Date.now();
      console.log('⏰ Wygasł:', isExpired ? '❌ TAK' : '✅ NIE');
      
      return {
        valid: true,
        header,
        payload,
        isExpired
      };
    } catch (error) {
      console.log('❌ Nie można zdekodować JWT:', error.message);
      return { valid: false, reason: `Cannot decode JWT: ${error.message}` };
    }
  },

  // ============================================================================
  // CZYSZCZENIE AUTORYZACJI
  // ============================================================================
  clearAuth() {
    console.log('%c🗑️ CZYSZCZENIE STANU AUTORYZACJI:', 'color: #D0021B; font-weight: bold;');
    
    const keys = ['access_token', 'refresh_token', 'user_data', 'token', 'user', 'refreshToken'];
    
    keys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Usunięto: ${key}`);
      }
    });
    
    console.log('🔄 Przeładuj stronę aby zastosować zmiany');
  },

  // ============================================================================
  // AUTOMATYCZNE NAPRAWY
  // ============================================================================
  async fixCommonIssues() {
    console.log('%c🔨 AUTOMATYCZNE NAPRAWY:', 'color: #9013FE; font-weight: bold;');
    
    const fixes = [];
    
    // Sprawdź i usuń nieprawidłowe tokeny
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      const validation = this.validateJWT(accessToken);
      if (!validation.valid || validation.isExpired) {
        localStorage.removeItem('access_token');
        fixes.push('🔧 Usunięto nieprawidłowy/wygasły access token');
      }
    }
    
    // Sprawdź dane użytkownika
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        JSON.parse(userData);
      } catch (e) {
        localStorage.removeItem('user_data');
        fixes.push('🔧 Usunięto uszkodzone dane użytkownika');
      }
    }
    
    // Sprawdź refresh token
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const validation = this.validateJWT(refreshToken);
      if (!validation.valid || validation.isExpired) {
        localStorage.removeItem('refresh_token');
        fixes.push('🔧 Usunięto nieprawidłowy/wygasły refresh token');
      }
    }
    
    if (fixes.length === 0) {
      console.log('✅ Nie znaleziono problemów do naprawienia');
    } else {
      fixes.forEach(fix => console.log(fix));
      console.log('🔄 Przeładuj stronę aby zastosować naprawy');
    }
    
    return fixes;
  },

  // ============================================================================
  // TEST LOGOWANIA
  // ============================================================================
  async testLogin(email = 'test@example.com', password = 'test123') {
    console.log('%c🔑 TEST LOGOWANIA:', 'color: #50E3C2; font-weight: bold;');
    console.log(`📧 Email: ${email}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: email,
          password: password,
        }),
      });
      
      console.log('📡 Status:', response.status);
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Test logowania udany');
        console.log('📋 Otrzymane dane:', {
          user: data.user ? data.user.username : 'brak',
          tokens: data.tokens ? 'obecne' : 'brak'
        });
        return { success: true, data };
      } else {
        console.log('❌ Test logowania nieudany');
        console.log('📋 Błąd:', data);
        return { success: false, error: data };
      }
    } catch (error) {
      console.log('❌ Błąd sieciowy:', error.message);
      return { success: false, networkError: error.message };
    }
  }
};

// ============================================================================
// DODAJ DO WINDOW DLA ŁATWEGO DOSTĘPU W KONSOLI
// ============================================================================
if (typeof window !== 'undefined') {
  window.AuthDebug = AuthDebug;
  console.log('🔧 AuthDebug dostępne w konsoli przez: window.AuthDebug');
  console.log('💡 Użyj: AuthDebug.fullDiagnostic() aby uruchomić pełną diagnostykę');
}

export default AuthDebug;