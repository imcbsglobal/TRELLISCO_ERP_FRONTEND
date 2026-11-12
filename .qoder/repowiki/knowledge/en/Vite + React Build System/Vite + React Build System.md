---
kind: build_system
name: Vite + React Build System
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - vite.config.js
    - eslint.config.js
    - .env
    - index.html
---

## Build System Overview

This is a Vite + React single-page application with no custom build scripts, Dockerfile, Makefile, or CI pipeline in the repository. The entire build and development workflow is driven by npm scripts that delegate to Vite.

## Key Files

- `package.json` — project manifest, dependency declarations, and npm scripts (`dev`, `build`, `lint`, `preview`).
- `vite.config.js` — Vite configuration: React plugin, dev server proxy rules for `/api` (local Django on port 8000) and `/terp-api` (remote T-ERP at `https://activate.imcbs.com`).
- `eslint.config.js` — flat ESLint config extending `@eslint/js` recommended, `react-hooks` recommended, and `react-refresh` Vite preset; ignores `dist/`; applies to `**/*.{js,jsx}` with browser globals.
- `.env` — present but not inspected here; used alongside Vite's `import.meta.env`.
- `index.html` — HTML entrypoint loaded by Vite.
- `dist/` — output directory produced by `vite build`.

## Architecture & Conventions

### Toolchain
- **Bundler**: Vite 8.x (`vite` ^8.3.0).
- **Framework**: React 19.x with `@vitejs/plugin-react` 6.x.
- **CSS**: SCSS via `sass-embedded` 1.x; styles live co-located with components as `.scss` files.
- **Linting**: ESLint 10.x using the new flat config format (`eslint.config.js`) with `@eslint/js`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.
- **Routing**: `react-router-dom` 7.x.
- **HTTP client**: `axios`.
- **Runtime type of package**: ESM (`"type": "module"`).

### Scripts
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Starts the Vite dev server with HMR and the configured proxies. |
| `npm run build` | `vite build` | Produces an optimized production bundle into `dist/`. |
| `npm run lint` | `eslint .` | Lints all JS/JSX files (excluding `dist/`). |
| `npm run preview` | `vite preview` | Serves the built `dist/` locally for post-build inspection. |

There are no separate staging/prod build variants, no version bumping script, no artifact publishing step, and no cross-compilation targets.

### Dev Server Proxy Convention
`vite.config.js` defines two proxy targets:
- `/api` → `http://localhost:8000` (commented as the local Django backend).
- `/terp-api` → `https://activate.imcbs.com` with `secure: true` and a path rewrite that strips the `/terp-api` prefix so upstream requests land on the root of the remote host.

This convention means API calls from the SPA should be made against `/api/...` (local dev) or `/terp-api/...` (T-ERP integration), never directly against the backend hostnames.

### Output
`vite build` writes static assets into `dist/` (already committed as an empty placeholder). There is no deployment step in this repo — the `dist/` folder is the final artifact.

## Conventions & Constraints

- **Build tool**: All compilation and bundling goes through Vite; there are no Makefiles, shell build scripts, or custom webpack rollups.
- **Script surface**: Only four npm scripts exist (`dev`, `build`, `lint`, `preview`); adding new build steps should follow this pattern rather than introducing ad-hoc shell commands.
- **Module format**: The package is ESM-only (`"type": "module"`), so all top-level imports/exports must use ES module syntax.
- **Lint scope**: ESLint flat config applies to `**/*.{js,jsx}` and explicitly ignores `dist/`; new source files should be placed under `src/` so they are picked up.
- **SCSS usage**: Styles are colocated per-component as `.scss` files next to their `.jsx` counterparts (e.g. `components/Nav.jsx` + `components/Nav.scss`), and compiled via `sass-embedded`.
- **Environment variables**: A `.env` file exists at the repo root; Vite consumes them via `import.meta.env.*` during build/dev.
- **No CI / Docker / release automation**: No GitHub Actions, GitLab CI, Dockerfile, Makefile, or release script was found in the repository. Deployment is therefore external to this codebase.