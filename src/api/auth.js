// src/api/auth.js
import { api, getToken, setToken, clearToken } from './client'

export async function login(email, password, { remember = true } = {}) {
  // axios resolves to the full response object — the actual body the
  // backend sent back is on response.data, not on the response itself.
  const response = await api.post('/blog/admin/login/', { email, password })
  const { token, user } = response.data

  // Store the token the same way client.js's interceptor reads it back,
  // so every subsequent API call actually carries a valid Authorization
  // header instead of silently going out unauthenticated.
  setToken(token, { remember })

  const storage = remember ? window.localStorage : window.sessionStorage
  storage.setItem('trellisco_admin_user', JSON.stringify(user))

  return user
}

export async function logout() {
  try {
    await api.post('/blog/admin/logout/')
  } finally {
    clearToken()
    window.localStorage.removeItem('trellisco_admin_user')
    window.sessionStorage.removeItem('trellisco_admin_user')
  }
}

export function isAuthenticated() {
  return Boolean(getToken())
}

export function getCurrentUser() {
  const raw =
    window.localStorage.getItem('trellisco_admin_user') ||
    window.sessionStorage.getItem('trellisco_admin_user')
  return raw ? JSON.parse(raw) : null
}