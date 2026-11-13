---
kind: build_system
name: Vite + Node build for Trellisco Marketing SPA
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - vite.config.js
    - eslint.config.js
    - index.html
---

## Build System Overview

This repository is a Vite + React single-page application. The entire build and artifact pipeline is defined in `package.json` scripts backed by the Vite CLI; there are no Makefiles, Dockerfiles, CI pipelines, or shell-based release scripts in the repository.

## Key Files

- `package.json` — declares the project (`marketing-trellisco`, private), Node ESM (`"type": "module"`), version `0.0.0`, and all npm scripts plus runtime/dev dependencies.
- `vite.config.js` — Vite configuration: React plugin, dev server on port `5173` with `strictPort: true`, and three dev-only API proxies (`/api` → Django at `localhost:8000`, `/terp-api` → `https://activate.imcbs.com`, `/central-api` → `https://centralmastermanagement.imcbs.com`).
- `eslint.config.js` — ESLint v10 flat config consumed by the `lint` script.
- `index.html` — Vite entry HTML (bootstraps `src/main.jsx`).
- `dist/` — output directory where `vite build` writes the production bundle.

## Scripts and Commands

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Starts the Vite dev server (React HMR) on port 5173 |
| `build` | `vite build` | Produces optimized static assets into `dist/` |
| `preview` | `vite preview` | Serves the built `dist/` locally |
| `lint` | `eslint .` | Runs ESLint against the whole tree using `eslint.config.js` |
| `mailer` | `php -S 127.0.0.1:8081 -t mailer` | Starts PHP's built-in HTTP server to serve `mailer/send.php` locally |

## Architecture and Conventions

- **Build tool**: Vite 8.x with `@vitejs/plugin-react`. There is no Webpack, Parcel, or custom bundler.
- **Module system**: ESM throughout (`"type": "module"`); both `vite.config.js` and `eslint.config.js` use `import`/`export`.
- **Styling**: SCSS via `sass-embedded`; each component/page pairs a `.jsx` file with a sibling `.scss` file (e.g., `components/Footer.jsx` + `Footer.scss`, `pages/Home.jsx` + `Home.scss`).
- **Dev proxying**: All cross-origin backend calls go through Vite's dev-server proxy so the SPA runs same-origin during development. Production builds do not include these proxies — they rely on the deployed frontend being served from the same origin as the backends.
- **Versioning**: The package version is hard-coded to `0.0.0` in `package.json`; there is no automated version bumping script, tag, or changelog workflow visible in this repo.
- **Artifacts**: `vite build` outputs a `dist/` directory of static files. There is no post-build step that copies, hashes, or publishes artifacts beyond what Vite itself does.

## Constraints and Rules

- The dev server must bind to port **5173** exactly. `vite.config.js` sets `port: 5173` and `strictPort: true`, and the comment explains that silently falling back would break Google OAuth because the redirect origin would change — so the build fails loudly if another process owns the port.
- The `mailer` npm script is a convenience wrapper around PHP's built-in server (`php -S 127.0.0.1:8081 -t mailer`) and is only relevant for local testing of `mailer/send.php`; it is not part of the main app build.
- No containerization, CI, or deployment manifests exist in this repository; any Dockerfile, GitHub Actions, GitLab CI, or release automation lives outside this repo (likely in the parent monorepo or separate infra repos).

## Notable Absences

No `Makefile`, `Dockerfile`, `docker-compose.yml`, `.github/workflows/`, `.gitlab-ci.yml`, `build.sh`, or release/version-bump scripts were found. The build surface is entirely npm/Vite.