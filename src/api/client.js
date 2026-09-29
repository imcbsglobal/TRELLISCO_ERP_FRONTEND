// src/api/client.js
import axios from "axios"

// Set VITE_API_BASE_URL in your env file (must include /api), e.g.:
//   .env              -> VITE_API_BASE_URL=http://localhost:8000/api
//   .env.production   -> VITE_API_BASE_URL=https://api.yourdomain.com/api
// Vite bakes this in at BUILD time, so set it before `npm run build`.
const ENV_BASE_URL = import.meta.env.VITE_API_BASE_URL

// In a production build a missing URL is a deployment mistake — fail loudly
// instead of silently calling localhost from every visitor's browser.
if (!ENV_BASE_URL && import.meta.env.PROD) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Add it to .env.production and rebuild."
  )
}

// The localhost fallback only applies to `npm run dev`.
const BASE_URL = (ENV_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, "")

const TOKEN_KEY = "trellisco_token"

/* ───────────────────────────────
   TOKEN HELPERS
─────────────────────────────── */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token, { remember = true } = {}) {
  clearToken()
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

/* ───────────────────────────────
   AXIOS INSTANCE (authenticated — admin pages)
─────────────────────────────── */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach the token to every outgoing request, if one exists.
// IMPORTANT: DRF's TokenAuthentication expects the scheme "Token <key>",
// not "Bearer <key>" — using the wrong scheme makes every authenticated
// request silently fail with 401, even with a valid token.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// If the backend says the token is invalid/expired, clear it out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearToken()
    }
    return Promise.reject(error)
  }
)

/* ───────────────────────────────
   AXIOS INSTANCE (public — visitor-facing pages)
   Never sends the admin token, so the public blog always sees exactly
   what a normal visitor would see (no drafts, no scheduled posts, no
   expired posts) even when an admin is logged in in the same browser.
─────────────────────────────── */
export const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})