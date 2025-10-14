// Lasko_app/frontend/lasko-frontend/src/services/apiClient.js
import axios from 'axios'

const base = import.meta.env.VITE_API_BASE_URL || '/api'

// Zadbaj o brak podwójnych slashes
const trim = (s) => s.replace(/\/+$/, '')
export const API_BASE = trim(base)

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // ustaw na true jeżeli używasz cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Opcjonalny helper do budowy pełnego URL (np. dla uploadów)
export const apiUrl = (path = '') => `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
