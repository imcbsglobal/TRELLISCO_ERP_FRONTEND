---
kind: configuration_system
name: Vite Environment Variables and API Base URL Configuration
category: configuration_system
scope:
    - '**'
source_files:
    - src/config/config.js
    - vite.config.js
    - src/api/client.js
    - src/api/api.js
    - src/api/promoVideoApi.js
    - src/pages/TERPLogin.jsx
---

## Approach

The project uses **Vite's built-in environment variable system** (`import.meta.env`) as its sole configuration mechanism. There is no `.env` file committed to the repo (only a `.gitignore`), no YAML/TOML/JSON config files, and no runtime config loader. All externalized settings are Vite env vars prefixed with `VITE_`, which Vite injects at build time.

## Key Files

- `src/config/config.js` — single exported constant `API_BASE_URL` read from `import.meta.env.VITE_API_URL` with a fallback of `http://127.0.0.1:8000`.
- `vite.config.js` — development server proxy rules for `/api` → `localhost:8000` and `/terp-api` → `https://activate.imcbs.com`.
- `src/api/client.js` — Axios instance that reads `VITE_API_BASE_URL` and enforces its presence in production.
- `src/api/promoVideoApi.js` — inline `VITE_API_URL` usage with a localhost fallback.
- `src/pages/TERPLogin.jsx` — reads `VITE_TERP_PROJECTS_API_URL`, `VITE_TERP_LICENSE_CREATE_API_URL`, and `VITE_GOOGLE_CLIENT_ID`.

## Architecture and Conventions

1. **Single source of truth pattern**: The preferred path is to import `API_BASE_URL` from `src/config/config.js` (used by `src/api/api.js`). This centralizes the base URL behind one export.
2. **Fallback defaults**: Where a value is optional, code falls back to a local dev endpoint (e.g. `http://127.0.0.1:8000` or `http://localhost:8000`).
3. **Environment-file convention**: `src/api/client.js` documents the expected `.env` / `.env.production` variables:
   - `VITE_API_BASE_URL=http://localhost:8000/api` (development)
   - `VITE_API_BASE_URL=https://api.yourdomain.com/api` (production)
4. **Production guard**: `client.js` throws an error at startup if `VITE_API_BASE_URL` is missing in production (`import.meta.env.PROD`):
   ```
   "VITE_API_BASE_URL is not set. Add it to .env.production and rebuild."
   ```
5. **Feature/secrets via env vars**: Google OAuth client ID is consumed as `VITE_GOOGLE_CLIENT_ID` in `TERPLogin.jsx`; TERP backend endpoints are consumed as `VITE_TERP_PROJECTS_API_URL` and `VITE_TERP_LICENSE_CREATE_API_URL`.
6. **Development proxying**: Instead of hardcoding different URLs per environment, the Vite dev server proxies `/api` to `localhost:8000` and `/terp-api` to `https://activate.imcbs.com` (with `changeOrigin: true`, `secure: true`, and path rewriting). This lets the SPA call same-origin-like paths during local development.

## Observed Inconsistencies

Two parallel patterns coexist:
- `src/config/config.js` exposes `API_BASE_URL` from `VITE_API_URL`.
- `src/api/client.js` reads `VITE_API_BASE_URL` directly.
- `src/api/promoVideoApi.js` also reads `VITE_API_URL` inline.

This means there are two distinct env var names (`VITE_API_URL` vs `VITE_API_BASE_URL`) and two distinct default values (`http://127.0.0.1:8000` vs `http://localhost:8000`), depending on which module is used. Consumers should prefer importing `API_BASE_URL` from `src/config/config.js` to stay consistent with the documented `VITE_API_BASE_URL` convention in `client.js`.

## Rules Enforced by Code

- A `.env.production` file containing `VITE_API_BASE_URL` is required when building for production; otherwise `client.js` aborts at startup with an explicit error message.
- Any env var consumed at runtime must be prefixed with `VITE_` because Vite only exposes those variables to the browser bundle.
- Development API calls go through the Vite dev server proxy (`/api`, `/terp-api`) rather than direct cross-origin requests.