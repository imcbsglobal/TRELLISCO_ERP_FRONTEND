---
kind: dependency_management
name: npm-based dependency management with lockfile and scoped version ranges
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
---

## Approach

This is a single-package Vite + React SPA. Dependency management is handled entirely by **npm** (Node.js package manager) using the standard `package.json` manifest plus a committed `package-lock.json` lockfile. There is no vendoring, no private registry configuration, and no monorepo tooling — all third-party code comes from the public npm registry.

## Key files

- `package.json` — declares runtime dependencies (`axios`, `matter-js`, `ogl`, `react`, `react-dom`, `react-router-dom`) and development dependencies (`vite`, `@vitejs/plugin-react`, `eslint`, `sass-embedded`, TypeScript types, etc.). It also defines scripts for `dev`, `build`, `lint`, `preview`, and a local PHP mailer server.
- `package-lock.json` — npm v3 lockfile (`lockfileVersion: 3`) that pins every transitive dependency to an exact resolved URL under `https://registry.npmjs.org/...` along with `integrity` sha512 hashes. This is the source of truth for reproducible installs.
- `node_modules/` — the installed tree (gitignored via `.gitignore`).
- No `.npmrc`, no `.yarnrc`, no `pnpm-lock.yaml`, no `go.mod`, no `vendor/` directory.

## Versioning conventions

All versions in `package.json` use the caret (`^`) range operator (e.g. `"react": "^19.2.8"`, `"vite": "^8.3.0"`, `"axios": "^1.20.0"`). This allows patch-level updates while blocking major-version bumps at install time. The lockfile then resolves these ranges to concrete versions (e.g. `react` → `7.29.7` for Babel packages, `react` itself pinned in the lockfile). Runtime and dev dependencies are separated into distinct top-level fields rather than being mixed.

## Build-time vs runtime split

The manifest cleanly separates:
- **Runtime deps** (`dependencies`): libraries shipped to production — `react`, `react-dom`, `react-router-dom`, `axios`, `matter-js`, `ogl`.
- **Dev deps** (`devDependencies`): tooling only used during development/build — `vite`, `@vitejs/plugin-react`, `eslint`, `sass-embedded`, `@types/react`, `globals`.

## Scripts as dependency entry points

`package.json` scripts invoke the tools declared in `devDependencies` directly (`vite`, `eslint`), so there is no separate shell wrapper around them. The `mailer` script uses the system-installed `php -S` command to serve the `mailer/` directory locally; this is not managed by npm.

## Constraints and rules observed

- The project is marked `"private": true` in `package.json`, which prevents accidental publication to the npm registry.
- The lockfile is committed alongside the manifest, so deterministic installs are enforced by npm's default behavior when `package-lock.json` exists.
- No custom npm registry or authentication is configured (no `.npmrc` found); all packages resolve against the default public registry.
- No vendored copies of third-party JS exist outside `node_modules`; assets under `src/assets/` are images/SVGs bundled by Vite, not npm packages.