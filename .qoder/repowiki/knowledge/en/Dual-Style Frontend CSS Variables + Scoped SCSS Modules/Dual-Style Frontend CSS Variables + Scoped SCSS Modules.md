---
kind: frontend_style
name: 'Dual-Style Frontend: CSS Variables + Scoped SCSS Modules'
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/App.css
    - src/components/Nav.scss
    - src/pages/Home.scss
    - src/components/FallingText.css
    - package.json
    - vite.config.js
---

# Frontend Style System

## Approach

The Trellisco marketing SPA uses a **dual styling approach** with no shared design system or component library:

1. **Global CSS variables** in `src/index.css` define the app-wide tokens (colors, fonts, shadows) consumed by the Vite starter shell and any component that imports it.
2. **Per-file scoped SCSS modules** under `src/components/` and `src/pages/` carry the bulk of the visual style — each page/component ships its own `.scss` file co-located with its JSX.
3. A few small components still use plain `.css` files (`FallingText.css`, `GlowCursor.css`).
4. No CSS-in-JS, Tailwind, or UI framework is used; dependencies are limited to React, Vite, Sass (`sass-embedded`), and runtime animation libraries (`matter-js`, `ogl`).

## Key Files

- `src/index.css` — global `:root` design tokens (`--text`, `--accent`, `--border`, `--shadow`, font families, base typography).
- `src/App.css` — leftover Vite starter styles (counter, hero, next-steps); not part of the production marketing UI.
- `src/components/Nav.scss` (~1570 lines) — the largest single stylesheet; defines the navigation, mega-menu, mobile drawer, and announcement banner using BEM-style class names.
- `src/pages/Home.scss` (~2240 lines) — landing-page styles: dark-blue hero, floating icons, scroll-driven "falling box" scene, About section, FAQ accordion.
- `src/components/FallingText.css` — lightweight plain-CSS fallback for the physics-based falling text component.
- `vite.config.js` — only configures the dev server proxy; no Sass/global stylesheet configuration beyond default Vite behavior.

## Architecture & Conventions

### Design Tokens

Tokens live in two places rather than a centralized theme file:

- Global tokens in `src/index.css` via CSS custom properties on `:root` (`--text`, `--bg`, `--accent`, `--accent-bg`, `--accent-border`, `--social-bg`, `--shadow`, `--sans`, `--heading`, `--mono`). These are consumed by the Vite starter shell (`App.css`) and set the light color scheme (`color-scheme: light`).
- Component-level SCSS `$` variables per file (e.g. `src/components/Nav.scss` declares `$c-border`, `$c-text`, `$c-muted`, `$c-blue`, `$c-red`, `$font`; `src/pages/Home.scss` declares `$grad-*`, `$hero-*`, `$ink`, `$white`, `$radius-lg`, `$bp-tablet`, `$bp-mobile`, `$bp-small`). There is no cross-file token import — each stylesheet owns its palette.

### Naming Convention

Styles follow a **BEM-like convention** with SCSS nesting:

- Block: `.nav`, `.mega`, `.hero-banner`, `.about`, `.faq`.
- Element: double-underscore sub-elements like `.nav__bar`, `.nav__link`, `.mega__panel`, `.hero-banner__title`, `.about__card`.
- Modifier: dot-prefixed classes such as `.is-active`, `.is-scrolling`, `.btn--primary`, `.btn--ghost`, `.nav__drawer-backdrop`.

This pattern is consistent across `Nav.scss`, `Home.scss`, `Footer.scss`, `Sidebar.scss`, and the admin pages under `pages/AdminDashboard/`.

### Responsive Strategy

There is no breakpoint utility library. Breakpoints are declared as SCSS variables and applied via `@media` queries:

- `src/pages/Home.scss` defines `$bp-tablet: 860px`, `$bp-mobile: 640px`, `$bp-small: 400px` and nests responsive rules inside the block.
- `src/index.css` uses a hard-coded `max-width: 1024px` media query for the global font-size fallback.
- Mobile-specific overrides hide heavy animations (`.hero-flow__stage`, `.hero-float__body`) and switch layouts from grid/flex-row to column.

### Typography

- Global sans-serif stack: `system-ui, 'Segoe UI', Roboto, sans-serif` (in `index.css`).
- Marketing sections load **Plus Jakarta Sans** via `@import url(...)` at the top of their SCSS files (`Nav.scss`, `Home.scss`) and apply it through a local `$font-display` variable.
- Font weights range from 300–800; headings consistently use `font-weight: 800` with tight letter-spacing (`-0.02em` to `-0.03em`).

### Motion & Accessibility

- Animations are defined inline as `@keyframes` within the same file (e.g. `heroBob`, `aboutFloat`, `mega-drop`, `nav-marquee`).
- `will-change` is used sparingly on GPU-heavy animated elements (`transform`, `opacity`) driven by JS (`Home.jsx`, `FallingText.jsx`).
- `prefers-reduced-motion: reduce` is respected in `Home.scss` to disable floating animations and reveal transitions.
- Focus management uses a shared `@mixin focus-ring` in `Nav.scss` that applies `outline: 2px solid $c-blue; outline-offset: 2px` on `:focus-visible`.

### Animation Libraries

Visual effects rely on third-party runtime libraries rather than CSS-only solutions:

- `matter-js` powers the falling-word physics in `FallingText.jsx` / `FallingText.css`.
- `ogl` (WebGL) is imported but not styled here; likely used elsewhere for 3D visuals.

## Conventions Observed

- Each React component/page pairs its JSX with a co-located `.scss` (or `.css`) file imported alongside the component.
- Colors are expressed as SCSS `$` variables per file, not reused through a central palette — this means brand colors can drift between components.
- Interactive states (`:hover`, `:focus-visible`, `.is-active`) are consistently styled with `transition: ... 0.15s ease`.
- Buttons use a `.btn` base with `--primary` / `--ghost` modifiers; pill-shaped buttons use `border-radius: 999px`.
- Box shadows are defined once in `index.css` (`--shadow`) and referenced where appropriate; many components define their own ad-hoc shadows instead.
- The global root sets `box-sizing: border-box` and `#root { min-height: 100svh }` for stable mobile viewport height.
- Fonts are loaded via Google Fonts `@import` statements at the top of the SCSS files that need them, not via `<link>` tags in HTML.

## Rules Enforced by Tooling

- ESLint (`eslint.config.js`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`) enforces React code quality but does **not** enforce CSS/SCSS style rules — there is no stylelint or Prettier configured in `package.json`.
- Vite compiles SCSS out of the box via the `sass-embedded` dev dependency; no custom Sass include paths or global stylesheets are registered in `vite.config.js`.
- The build script is `vite build` and the dev server runs on port `5173` with `strictPort: true` (enforced by Vite config to avoid OAuth origin mismatches).

## What Is Not Used

No Tailwind, PostCSS, CSS Modules, CSS-in-JS (styled-components/emotion), or design-token package is present. The project has no shared component library — reusable UI pieces (Nav, Footer, Sidebar, CredentialsModal, FloatingChatbot) are hand-written React components with their own styles.