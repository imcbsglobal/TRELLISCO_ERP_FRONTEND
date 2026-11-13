---
kind: configuration_system
name: Vite-based Environment Configuration and Feature Flags
category: configuration_system
scope:
    - '**'
source_files:
    - src/config/config.js
    - src/config/projectFlags.js
    - vite.config.js
    - package.json
---

## Overview

The Trellisco marketing SPA uses Vite's built-in environment variable system (`import.meta.env`) for runtime configuration, with a small dedicated `src/config/` module exposing the application's API base URL and feature-flag mappings. There is no `.env` file committed to the repo; environment values are expected to be supplied by the developer or build tooling at startup.

## Key Files

- `src/config/config.js` — single source of truth for the backend API base URL.
- `src/config/projectFlags.js` — static mapping between T-ERP project identifiers and Central Master user-master flags (feature toggles).
- `vite.config.js` — development server proxy configuration pointing at Django (`localhost:8000`), T-ERP (`https://activate.imcbs.com`), and Central Master (`https://centralmastermanagement.imcbs.com`).
- `package.json` — declares `type: "module"` so `import.meta.env` is available, and exposes `dev` / `build` / `preview` scripts that drive Vite.

## Architecture and Conventions

### Runtime config via `import.meta.env`

`src/config/config.js` reads the Vite env var `VITE_API_URL` and falls back to `http://127.0.0.1:8000`:

```js
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
```

This is the only place in the codebase that touches `import.meta.env`. Consumers import `API_BASE_URL` from `src/config/config.js` rather than reading env vars directly. The convention is therefore:

- All client-facing backend endpoints are addressed relative to `API_BASE_URL`.
- The default points at the local Django dev server; production overrides are expected to come from the Vite build-time environment (e.g. a `.env.production` file or CI-provided variables prefixed with `VITE_`).

### Feature flags as static mappings

`src/config/projectFlags.js` does not load flags from a remote service at runtime. Instead it defines three static maps:

- `USER_MASTER_FLAGS` — the complete set of flags the Central Master `/api/user-master/` endpoint accepts (e.g. `trellisco`, `claudius`, `melone`, `tixelise`, `trellisco_crm`, `melone_stay`, `trellisco_books`, `fee_flow`).
- `PROJECT_FLAG_BY_ENDPOINT` — maps T-ERP project `api_endpoint` values to those flag names.
- `PROJECT_FLAG_BY_NAME` — fallback mapping keyed by display name (e.g. `"melone stay" → `melone_stay`).

The exported `flagsForProjects(selectedProjects)` function builds an object whose keys are all flags from `USER_MASTER_FLAGS` initialized to `false`, then sets to `true` any flag matched from the selected projects' `api_endpoint` or `project`/`name` fields. This is used to construct payloads sent to Central Master when creating licenses.

### Development proxies as configuration

`vite.config.js` configures three dev-server proxies under `server.proxy`:

| Prefix | Target | Purpose |
|---|---|---|
| `/api` | `http://localhost:8000` | Django backend (default) |
| `/terp-api` | `https://activate.imcbs.com` | T-ERP license activation |
| `/central-api` | `https://centralmastermanagement.imcbs.com` | Central Master user-master management |

Each proxy uses `changeOrigin: true`; `/terp-api` and `/central-api` also use `secure: true` and strip their prefix via a `rewrite` function so the upstream sees the original path. The comment explains that these exist because the upstream services do not send CORS headers, so the dev server acts as a same-origin relay during local development.

The dev server itself is pinned to port `5173` with `strictPort: true`; the comment states this is required because Google OAuth treats a different port as an origin mismatch.

### No secrets handling

There is no `.env` file, no secret manager integration, and no encrypted configuration files in the repository. Secrets are not loaded at the frontend layer — they belong on the backend servers. The only sensitive value exposed to the browser would be `VITE_API_URL`, which is intentionally non-secret (it is just a host/port).

## Conventions and Constraints

- **Env var naming**: Only Vite-prefixed variables are consumed, specifically `VITE_API_URL`. Any new client-facing setting must follow this `VITE_` prefix convention to be injected by Vite.
- **Single config entry point**: Backend URLs are accessed through the named export `API_BASE_URL` from `src/config/config.js`; consumers should not call `import.meta.env` directly elsewhere.
- **Feature flags are declared centrally**: New product flags require updates in three places inside `src/config/projectFlags.js` — `USER_MASTER_FLAGS`, `PROJECT_FLAG_BY_ENDPOINT`, and `PROJECT_FLAG_BY_NAME` — plus the `flagsForProjects` logic if the matching strategy changes.
- **Dev proxy prefixes are the contract**: Frontend code calls `/api`, `/terp-api`, and `/central-api`; changing a target requires updating both `vite.config.js` and any corresponding frontend route/base-path usage.
- **Strict port enforcement**: The dev server will fail loudly (not silently fall back) if port 5173 is already in use, enforced by `strictPort: true` in `vite.config.js`.
- **No runtime config loading**: The application has no dynamic config loader, no JSON/YAML/TOML config files, and no environment-file parser — configuration is purely compile-time via Vite's `import.meta.env` and static JS constants.