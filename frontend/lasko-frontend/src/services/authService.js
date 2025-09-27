// frontend/src/services/authService.js
const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY   = 'user_data';

// ---- storage helpers ----
export function setTokens({ access, refresh, user } = {}) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  if (user && (user.id || user.username || user.email)) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  // user_data zwykle zostawiamy, ale u Ciebie chcesz czysto – usuńmy:
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || null;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || null;
}

export function getUserData() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---- jwt helpers ----
function base64UrlDecode(str) {
  try {
    const pad = '='.repeat((4 - (str.length % 4)) % 4);
    const base64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return decodeURIComponent(
      json.split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
    );
  } catch {
    return '{}';
  }
}

export function decodeJwt(token) {
  if (!token || token.split('.').length < 2) return {};
  const payload = token.split('.')[1];
  const json = base64UrlDecode(payload);
  try { return JSON.parse(json); } catch { return {}; }
}

// ⚠️ KLUCZOWE: exp jest w SEKUNDACH, a Date.now() w MILISEKUNDACH
export function isTokenValid(token, skewSeconds = 30) {
  if (!token) return false;
  const { exp } = decodeJwt(token);
  if (!exp) return false;
  const nowMs = Date.now();
  const expMs = exp * 1000; // <— to jest najczęstszy błąd
  const skewMs = skewSeconds * 1000;
  return expMs - skewMs > nowMs;
}

export function isAuthenticated() {
  const access = getAccessToken();
  return !!access && isTokenValid(access);
}

// ---- refresh ----
export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('Brak refresh tokena');

  const res = await fetch('/api/auth/token/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });

  if (!res.ok) {
    throw new Error(`Refresh nieudany: ${res.status}`);
  }

  const data = await res.json().catch(() => ({}));

  // Back-end może zwrócić tylko access, albo access + refresh (ROTATE_REFRESH_TOKENS=True)
  if (data.access) {
    setTokens({ access: data.access });       // zachowuje stary refresh
  }
  if (data.refresh) {
    setTokens({ refresh: data.refresh });     // jeśli jest nowy refresh, nadpisz
  }

  return { access: getAccessToken(), refresh: getRefreshToken() };
}

// ---- debug ----
export function debugAuth() {
  const access = getAccessToken();
  const refresh = getRefreshToken();
  const user = getUserData();
  console.group('[authService.debugAuth]');
  console.log('user:', user);
  console.log('has access:', !!access, 'valid:', isTokenValid(access));
  console.log('has refresh:', !!refresh);
  console.log('access payload:', decodeJwt(access));
  console.groupEnd();
}
// ==== getTokenInfo: używane w useAuth.js ====
export function getTokenInfo() {
  const token = getAccessToken();
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    return {
      userId: payload?.user_id ?? payload?.sub ?? null,
      username: payload?.username,
      exp: null,
      expiresAt: null,
      isExpired: true,
      timeToExpiry: -Infinity
    };
  }

  const expMs = payload.exp * 1000;
  return {
    userId: payload.user_id ?? payload.sub ?? null,
    username: payload.username,
    exp: payload.exp,
    expiresAt: new Date(expMs),
    isExpired: expMs <= Date.now(),
    timeToExpiry: expMs - Date.now()
  };
}