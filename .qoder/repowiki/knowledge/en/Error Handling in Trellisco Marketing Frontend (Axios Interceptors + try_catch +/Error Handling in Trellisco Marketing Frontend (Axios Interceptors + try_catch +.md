---
kind: error_handling
name: Error Handling in Trellisco Marketing Frontend (Axios Interceptors + try/catch + toError Helpers)
category: error_handling
scope:
    - '**'
source_files:
    - src/api/client.js
    - src/api/api.js
    - src/api/announcements.js
    - src/api/blogApi.js
    - src/api/promoVideoApi.js
    - src/pages/AdminDashboard/Announcement.jsx
    - src/pages/AdminDashboard/Dashboard.jsx
    - src/pages/AdminDashboard/Login.jsx
    - src/pages/AdminDashboard/Promovideo.jsx
    - src/pages/Blog.jsx
---

## Approach

The Trellisco marketing frontend is a Vite + React SPA with no dedicated error-handling framework. Errors are handled through three complementary layers:

1. **Axios interceptors** for cross-cutting concerns (auth token attachment, 401 cleanup).
2. **Per-API `try`/`catch` blocks** that wrap each HTTP call and convert backend responses into user-facing `Error` messages.
3. **Page-level `try`/`catch`** blocks that catch the propagated errors and render them via component state (`setError(...)`).

There is no global error boundary, no custom error class hierarchy, no error-code enum, and no `panic`/`recover` equivalent — only plain JavaScript `Error` objects thrown from async functions.

## Key Files

- `src/api/client.js` — shared Axios instances (`api`, `publicApi`) with request/response interceptors; also holds token helpers (`getToken`, `setToken`, `clearToken`).
- `src/api/api.js` — a second, separate Axios instance used by some older endpoints (e.g., auth), with its own interceptor logic.
- `src/api/announcements.js` — defines a local `toError(err)` helper that flattens DRF field-error objects into a single string message.
- `src/api/blogApi.js` — direct axios calls; `uploadContentFile` wraps failures in `new Error(err.response?.data?.detail || 'Upload failed')`.
- `src/api/promoVideoApi.js` — uses native `fetch` (not axios); defines a local `errorMessage(data, fallback)` helper and a `handle(res, fallback)` wrapper that throws `new Error(errorMessage(data, fallback))` when `res.ok` is false.
- Page components under `src/pages/AdminDashboard/` (`Announcement.jsx`, `Dashboard.jsx`, `Login.jsx`, `Promovideo.jsx`) and `src/pages/Blog.jsx` — contain `try`/`catch` blocks that set UI error state.

## Architecture & Conventions

### Two Axios instances with different auth semantics

`client.js` exports two instances:

- `api` — authenticated; attaches `Authorization: Token <key>` (DRF TokenAuthentication scheme) via a request interceptor. On 401 response, it clears the stored token and rejects the promise.
- `publicApi` — unauthenticated; deliberately never sends the admin token so visitor pages see exactly what an anonymous user would (no drafts, scheduled posts, or expired posts even if an admin is logged in in the same browser).

A comment in `client.js` explicitly documents why the `Token` scheme (not `Bearer`) is required: using the wrong scheme makes every authenticated request silently fail with 401.

`api.js` defines a third, independent axios instance with its own interceptor that reads `access_token` from `localStorage`. This appears to be legacy code coexisting with the newer `client.js` pattern.

### Build-time configuration failure

At module load time, `client.js` checks whether `VITE_API_BASE_URL` is set in production builds:

```js
if (!ENV_BASE_URL && import.meta.env.PROD) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Add it to .env.production and rebuild."
  )
}
```

This is a deliberate design choice: a missing base URL is treated as a deployment mistake and fails loudly rather than silently calling `localhost` from every visitor's browser.

### Per-endpoint error normalization

Each API module normalizes backend errors into a single readable string before rethrowing:

- `announcements.js`: `toError(err)` extracts `err.response.data.detail`, then falls back to the first string value in a field-error object, then to `"Something went wrong. Please try again."`.
- `blogApi.js`: `uploadContentFile` throws `new Error(err.response?.data?.detail || 'Upload failed')`.
- `promoVideoApi.js`: `errorMessage(data, fallback)` handles strings, `detail`, arrays of strings, and nested objects, returning the most specific message available.

These normalized `Error` objects are then caught at the page layer, where callers typically display `err.message` or fall back to a hardcoded user-facing string.

### Page-layer error presentation

Pages use React state (`setError(...)`) to surface errors to the user. Examples:

- `AdminDashboard/Login.jsx`: catches login errors, prefers `error.response?.data?.detail`, otherwise shows `'Something went wrong. Please try again.'`.
- `AdminDashboard/Dashboard.jsx`: catches dashboard data loading errors similarly.
- `pages/Blog.jsx`: catches post-loading errors and sets a generic `'Could not load posts.'` message.

## Conventions Observed

- Backend errors come from Django REST Framework, which returns bodies like `{ detail: "..." }` or `{ field: ["message"] }`; all client-side wrappers extract these into a single string.
- Admin endpoints use the `api` instance (with `Token` auth header); public endpoints use `publicApi` (no auth header). The distinction is documented in comments rather than enforced by types.
- Auth token storage is centralized in `client.js` (`trellisco_token` key in `localStorage`/`sessionStorage`); `api.js` independently reads `access_token` from `localStorage` — this dual-storage pattern is inconsistent but both are observed in the codebase.
- Network errors (axios rejects, `fetch` non-OK responses) are converted to `Error` objects with human-readable messages; there is no structured error type or error-code taxonomy.
- There is no global error boundary, no central error logger, and no retry/backoff strategy — failures bubble up to the component that called the API function.
- The `try`/`catch` pattern is applied consistently around every async API call in both the API modules and the page components.