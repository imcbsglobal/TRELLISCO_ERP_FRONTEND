---
kind: error_handling
name: 'Frontend Error Handling: Axios Interceptors + Localized toError Wrappers'
category: error_handling
scope:
    - '**'
source_files:
    - src/api/client.js
    - src/api/api.js
    - src/api/auth.js
    - src/api/announcements.js
---

## Overview

This Vite + React SPA handles errors at two layers:

1. **Axios interceptor layer** (`src/api/client.js`, `src/api/api.js`) — centralizes auth-token lifecycle (attach, clear on 401) and rejects with the raw axios error.
2. **Per-module API wrappers** (e.g. `src/api/announcements.js`) — wrap each async call in `try/catch` and convert the axios error into a user-facing `new Error(...)` via a local `toError(err)` helper that reads DRF's `{ detail }` or field-error payload.

There is no global error boundary, no custom error class hierarchy, no centralized error codes, and no `panic/recover` equivalent (this is JavaScript). Errors propagate as rejected Promises up to page components, which are expected to handle them locally.

## Key Files

- `src/api/client.js` — shared authenticated/unauthenticated axios instances, token helpers, request/response interceptors.
- `src/api/api.js` — secondary axios instance for the public blog (uses `access_token` from localStorage; note: its Authorization header assignment is syntactically broken — `Authorization = Bearer ;`).
- `src/api/auth.js` — login/logout, stores token via `client.setToken`, persists current user to storage.
- `src/api/announcements.js` — example of the per-endpoint `try/catch` + `toError(err)` pattern used by admin endpoints.

## Architecture & Conventions

### Two axios instances

`client.js` exports both `api` (admin, attaches `Token <key>` header) and `publicApi` (no auth header, so expired tokens do not cause 401s on public endpoints like the homepage announcement banner).

`api.js` defines a third instance using `API_BASE_URL` from config; it is separate from the `client.js` instance and uses a different token key (`access_token`) and scheme (`Bearer`), but the header assignment line is incomplete (`Authorization = Bearer ;`), so this instance does not actually attach a bearer token.

### Auth error handling in interceptors

Both instances implement an identical response-interceptor pattern:

```js
(error) => {
  if (error.response?.status === 401) {
    // clear stored token(s)
  }
  return Promise.reject(error);
}
```

- `client.js`: calls `clearToken()` (removes from both localStorage and sessionStorage) on 401.
- `api.js`: removes `access_token` and `refresh_token` from localStorage on 401.

The interceptor always re-throws the error via `Promise.reject(error)` so callers still receive it.

### Per-call error normalization

In `announcements.js`, every mutating admin endpoint wraps its axios call:

```js
try {
  const { data } = await api.post(PATH, payload);
  return data;
} catch (err) {
  throw toError(err);
}
```

`toError(err)` extracts a human-readable message from DRF responses: it prefers `data.detail`, falls back to the first string value in a field-error object, and finally returns the fallback `"Something went wrong. Please try again."`.

Public endpoints (e.g. `fetchActiveAnnouncement`) do NOT use this wrapper — they let axios errors bubble up unchanged, since the homepage must never depend on admin auth state.

### Build-time failure

`client.js` throws synchronously at module load time when `VITE_API_BASE_URL` is missing in production:

```js
if (!ENV_BASE_URL && import.meta.env.PROD) {
  throw new Error("VITE_API_BASE_URL is not set. Add it to .env.production and rebuild.");
}
```

This turns a misconfiguration into a hard failure rather than silently calling `localhost:8000`.

## Conventions Observed

- **No custom error classes.** All thrown values are plain `Error` instances created inline.
- **No sentinel error constants.** Error messages are string literals embedded in `toError` and the build-time check.
- **No global error boundary / error context provider.** Error handling lives in the API layer and individual pages/components that consume these functions.
- **DRF-specific error mapping.** The `toError` helper assumes Django REST Framework payloads (`detail` top-level, or field-error objects with string values).
- **Token clearing is centralized in interceptors**, not in callers — callers never manually remove tokens after a 401.
- **Two token schemes coexist:** `Token <key>` (admin, `client.js`) and `Bearer` (blog, `api.js`), stored under different keys (`trellisco_token` vs `access_token`/`refresh_token`). This dual setup is a legacy artifact — the `api.js` bearer implementation is currently non-functional due to the malformed header assignment.
- **Public vs admin separation is enforced by using two distinct axios instances**, not by conditional headers on one instance.

## Rules Enforced by Code

1. In production builds, `VITE_API_BASE_URL` must be defined — otherwise the app fails at startup (`client.js` lines 12–16).
2. Any 401 response clears the corresponding stored token automatically via the response interceptor (`client.js` line 70–72, `api.js` lines 29–32).
3. Admin API mutations in `announcements.js` normalize backend errors through `toError`, guaranteeing callers receive a plain `Error` with a readable message rather than an axios error object.