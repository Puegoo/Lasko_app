// src/services/validationService.js

// DLA VITE: używaj import.meta.env. Jeśli zmienna nie ustawiona, fallback na '/api/auth'.
// Upewnij się, że masz VITE_API_BASE w .env, np. VITE_API_BASE=/api/auth
const API_BASE = (import.meta.env?.VITE_API_BASE || '/api/auth').replace(/\/+$/, '');

async function parseAvailability(res) {
  if (!res.ok) throw new Error('network');
  let data = null;
  try {
    data = await res.json();
  } catch {
    // brak JSON
  }

  if (data && typeof data.available === 'boolean') return data.available; // {available:true/false}
  if (data && typeof data.exists === 'boolean') return !data.exists;      // {exists:true/false}
  if (data && typeof data.is_taken === 'boolean') return !data.is_taken;  // {is_taken:true/false}
  if (data && typeof data.free === 'boolean') return data.free;           // {free:true/false}

  // Nie rozpoznajemy odpowiedzi -> traktuj jako błąd, żeby NIE pokazywać zielonego ✓
  throw new Error('unsupported_response');
}

export async function checkEmailAvailability(email, signal) {
  const url = `${API_BASE}/check-email/?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { method: 'GET', signal, cache: 'no-store' });
  return parseAvailability(res);
}

export async function checkUsernameAvailability(username, signal) {
  const url = `${API_BASE}/check-username/?username=${encodeURIComponent(username)}`;
  const res = await fetch(url, { method: 'GET', signal, cache: 'no-store' });
  return parseAvailability(res);
}