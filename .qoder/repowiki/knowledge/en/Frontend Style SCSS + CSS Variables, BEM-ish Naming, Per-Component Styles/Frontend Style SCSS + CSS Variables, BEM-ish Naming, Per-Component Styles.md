---
kind: frontend_style
name: 'Frontend Style: SCSS + CSS Variables, BEM-ish Naming, Per-Component Styles'
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/App.css
    - src/components/Nav.scss
    - src/pages/Home.scss
    - src/components/Footer.scss
    - src/components/sidebar.scss
    - src/components/FloatingChatbot.scss
    - src/components/FallingText.css
    - src/components/GlowCursor.css
    - src/pages/Blog.scss
    - src/pages/Contact.scss
    - src/pages/Ecosystemsection.scss
    - src/pages/PlatformFeatures.scss
    - src/pages/Promovideoplayer.scss
    - src/pages/TERPLogin.scss
    - src/pages/BlogPost.scss
    - src/pages/AdminDashboard/Dashboard.scss
    - src/pages/AdminDashboard/Login.scss
---

## Approach

The Trellisco marketing frontend is a Vite + React SPA that styles itself with **SCSS** (via `sass-embedded`) and plain **CSS**. There is no UI component library, no Tailwind, and no CSS-in-JS runtime — styling lives in per-component `.scss` / `.css` files colocated next to their JSX.

## Key Files

- `src/index.css` — global design tokens via `:root` CSS custom properties (`--text`, `--accent`, `--border`, `--shadow`, `--sans`, etc.), base reset (`box-sizing: border-box`), body defaults, and the `#root` container.
- `vite.config.js` — only declares the React plugin; SCSS support comes from the `sass-embedded` devDependency, so all `.scss` files compile automatically.
- `src/components/Nav.scss` (~1573 lines) — the largest style file, defining the navigation, mega-menu, mobile drawer, and announcement banner.
- `src/pages/Home.scss` (~2241 lines) — hero, floating icons, scroll-driven animations, about-us section, FAQ accordion, and page-level buttons.
- Each page under `src/pages/*` has a matching `<Page>.scss` (Blog, Contact, Ecosystemsection, PlatformFeatures, Promovideoplayer, TERPLogin, BlogPost).
- Each shared component under `src/components/*` has a matching `.scss` (FallingText, FloatingChatbot, Footer, GlowCursor, Nav, Sidebar).
- Admin pages under `src/pages/AdminDashboard/*` follow the same pattern (Announcement.scss, Blog.scss, Dashboard.scss, Login.scss, Promovideo.scss).

## Architecture & Conventions

### Two parallel token systems

1. **Global CSS variables** in `src/index.css` define the app-wide palette and typography for the shell / admin area:
   - Colors: `--text`, `--text-h`, `--bg`, `--border`, `--accent`, `--accent-bg`, `--accent-border`, `--social-bg`, `--shadow`.
   - Fonts: `--sans`, `--heading`, `--mono`.
   - Base font size: `18px/145%` on desktop, `16px` at `max-width: 1024px`.
   - `color-scheme: light` and `min-height: 100svh` on `#root`.

2. **Per-file SCSS variables** define local palettes per page/component:
   - `Nav.scss`: `$c-border`, `$c-text`, `$c-muted`, `$c-blue`, `$c-blue-dark`, `$c-red`, `$c-yellow-bg`, `$c-panel-bg`, `$font = "Plus Jakarta Sans", ...`.
   - `Home.scss`: `$grad-*` gradient tokens, `$hero-blue-deep/mid/light/pale/cyan/glow`, `$ink`, `$white`, `$panel-bg`, `$radius-lg/md`, `$font-display`, breakpoints `$bp-tablet: 860px`, `$bp-mobile: 640px`, `$bp-small: 400px`.

There is no single centralized design-token file — each large SCSS file declares its own `$` variables at the top.

### Naming convention

- Component root classes use a BEM-like prefix: `.nav`, `.mega`, `.hero-banner`, `.hero-flow`, `.about`, `.faq`, `.btn`.
- Sub-elements use double-underscore: `.nav__bar`, `.nav__link`, `.hero-banner__title`, `.hero-flow__stage`, `.about__card`.
- Modifier classes use double-dash: `.btn--primary`, `.btn--ghost`, `.hero-dropbox--back`, `.hero-dropbox--front`, `.nav__mobile-item--login`, `.nav__mobile-item--contact`.
- State classes are dot-prefixed class names toggled by JS: `.is-active`, `.is-scrolling`, `.is-falling`, `.--in`.

### Mixins

Reusable patterns live as SCSS mixins in `Nav.scss`:
- `@mixin no-select-btn` — resets button appearance and applies `$font`.
- `@mixin focus-ring` — adds a `2px solid $c-blue` outline with `outline-offset: 2px` on `:focus-visible`.

These mixins are composed into interactive elements (`&__banner-close`, `&__link`, `&__login`, `&__contact`, `&__terp-login`, `&__group`, `&__subitem`, `&__close`).

### Responsive strategy

- Breakpoints are defined as SCSS variables per file rather than a shared config:
  - `Home.scss`: `$bp-tablet: 860px`, `$bp-mobile: 640px`, `$bp-small: 400px`.
  - Global fallbacks also appear as raw `@media (max-width: 1024px)` blocks in `index.css` and `App.css`.
- Mobile-first adjustments are applied inside `@media (max-width: $bp-mobile)` blocks.
- The nav switches to a hamburger + drawer layout below 900px (documented in a comment: "Hidden on desktop; switched on inside the 900px media query below").
- Fluid typography uses `clamp()` (e.g. `clamp(2.2rem, 4.4vw, 3.6rem)` for hero titles).

### Animation & motion

- Animations are declared as `@keyframes` within the same SCSS file (e.g. `heroBob`, `aboutFloat`).
- Scroll-driven state is toggled by JavaScript (class names like `.is-falling`, `--by`, `--to`, `--ty` CSS custom properties set inline).
- Motion respects user preference: `@media (prefers-reduced-motion: reduce)` disables `.hero-float__body` animation and hides animated stages.

### Typography

- Google Fonts are imported directly at the top of SCSS files via `@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@...:display=swap")`.
- Global sans-serif stack: `system-ui, 'Segoe UI', Roboto, sans-serif` (from `index.css`).
- Marketing pages override with `'Plus Jakarta Sans'` as `$font-display`.

### No framework dependencies

- `package.json` lists no CSS framework or component library. Dependencies are `react`, `react-dom`, `react-router-dom`, `axios`, `matter-js`, `ogl`. Styling is entirely hand-written SCSS/CSS.
- `eslint.config.js` enforces code quality but not CSS conventions.

## Observed Rules (descriptive)

- Every page/component owns its stylesheet in a sibling `.scss` file; there are no global layout rules beyond `index.css`.
- Interactive elements consistently apply both `@include no-select-btn` and `@include focus-ring` (or equivalent `:focus-visible` rules) for accessibility.
- Color usage goes through SCSS `$` variables (never bare hex literals scattered throughout selectors); brand colors are grouped under semantic prefixes (`$c-*`, `$hero-*`, `$about-*`, `$faq-*`).
- Hover states on links/buttons explicitly set `text-decoration: none` to suppress default underline behavior.
- Large animated sections gate themselves behind `will-change` and `isolate` to keep compositing efficient.
- The global CSS sets `color-scheme: light`, indicating the app does not implement a dark theme.