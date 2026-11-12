# Configuration and Environment

<cite>
**Referenced Files in This Document**
- [vite.config.js](file://vite.config.js)
- [eslint.config.js](file://eslint.config.js)
- [package.json](file://package.json)
- [src/config/config.js](file://src/config/config.js)
- [src/api/client.js](file://src/api/client.js)
- [src/pages/TERPLogin.jsx](file://src/pages/TERPLogin.jsx)
- [.gitignore](file://.gitignore)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains how the application is configured and how to set up environments for development, staging, and production. It covers:
- Vite configuration and environment variables
- Development server setup and API proxying
- Production build behavior and optimizations
- ESLint configuration for code quality
- Environment-specific settings and API endpoints
- Deployment considerations and common troubleshooting steps

The project uses Vite with React, Axios-based API clients, and a flat ESLint configuration. Environment variables are injected at build time via Vite’s import.meta.env system.

## Project Structure
Configuration-related files are centralized:
- Build tooling: vite.config.js, package.json scripts
- Linting: eslint.config.js
- Runtime configuration: src/config/config.js
- API client configuration: src/api/client.js
- Feature-specific environment usage: src/pages/TERPLogin.jsx
- Environment file handling: .gitignore

```mermaid
graph TB
A["Developer"] --> B["Vite Dev Server<br/>vite.config.js"]
B --> C["Proxy /api → Local Backend"]
B --> D["Proxy /terp-api → Remote T-ERP"]
E["Build Process<br/>package.json scripts"] --> F["Production Bundle"]
G["ESLint<br/>eslint.config.js"] --> H["Code Quality Checks"]
I["Environment Variables<br/>.env, .env.*"] --> J["import.meta.env"]
J --> K["API Base URL<br/>src/config/config.js"]
J --> L["Axios Client<br/>src/api/client.js"]
J --> M["TERP Endpoints<br/>src/pages/TERPLogin.jsx"]
```

**Diagram sources**
- [vite.config.js:5-23](file://vite.config.js#L5-L23)
- [package.json:6-10](file://package.json#L6-L10)
- [eslint.config.js:7-21](file://eslint.config.js#L7-L21)
- [src/config/config.js:1-3](file://src/config/config.js#L1-L3)
- [src/api/client.js:8-19](file://src/api/client.js#L8-L19)
- [src/pages/TERPLogin.jsx:7-12](file://src/pages/TERPLogin.jsx#L7-L12)

**Section sources**
- [vite.config.js:1-24](file://vite.config.js#L1-L24)
- [eslint.config.js:1-22](file://eslint.config.js#L1-L22)
- [package.json:1-33](file://package.json#L1-L33)

## Core Components
- Vite configuration defines plugins, dev server, and API proxies.
- ESLint configuration sets recommended rules for JS/JSX and React hooks.
- Environment variables are consumed via import.meta.env across the app.
- API client centralizes base URLs, token handling, and interceptors.
- TERP login page uses environment variables for Google Sign-In and remote endpoints.

Key responsibilities:
- vite.config.js: Dev server and proxy rules
- eslint.config.js: Linting rules and globals
- src/config/config.js: Centralized API base URL
- src/api/client.js: Authenticated and public Axios instances
- src/pages/TERPLogin.jsx: Environment-driven endpoints and Google client ID

**Section sources**
- [vite.config.js:5-23](file://vite.config.js#L5-L23)
- [eslint.config.js:7-21](file://eslint.config.js#L7-L21)
- [src/config/config.js:1-3](file://src/config/config.js#L1-L3)
- [src/api/client.js:8-19](file://src/api/client.js#L8-L19)
- [src/pages/TERPLogin.jsx:7-12](file://src/pages/TERPLogin.jsx#L7-L12)

## Architecture Overview
The runtime configuration flow relies on Vite injecting environment variables into the bundle. The API layer reads these variables to determine endpoints and authentication behavior.

```mermaid
sequenceDiagram
participant Dev as "Developer"
participant Vite as "Vite Dev Server"
participant Proxy as "Dev Proxy"
participant App as "React App"
participant API as "Backend API"
Dev->>Vite : npm run dev
Vite->>Proxy : Start dev server with proxy rules
App->>Proxy : Request "/api/..."
Proxy->>API : Forward to local backend (localhost : 8000)
API-->>Proxy : Response
Proxy-->>App : Response
Note over App,Proxy : Same-origin during dev avoids CORS issues
```

**Diagram sources**
- [vite.config.js:7-21](file://vite.config.js#L7-L21)

## Detailed Component Analysis

### Vite Configuration and Environment Variables
- Plugins: React plugin is enabled.
- Dev server:
  - Proxies /api to a local backend (default localhost:8000).
  - Proxies /terp-api to a remote T-ERP endpoint with secure HTTPS and path rewriting.
- Environment variables:
  - VITE_API_URL used by src/config/config.js.
  - VITE_API_BASE_URL used by src/api/client.js.
  - VITE_TERP_PROJECTS_API_URL and VITE_TERP_LICENSE_CREATE_API_URL used by src/pages/TERPLogin.jsx.
  - VITE_GOOGLE_CLIENT_ID used by src/pages/TERPLogin.jsx.

```mermaid
flowchart TD
Start(["App startup"]) --> ReadEnv["Read import.meta.env"]
ReadEnv --> CheckBaseURL{"VITE_API_BASE_URL set?"}
CheckBaseURL --> |Yes| UseEnv["Use provided base URL"]
CheckBaseURL --> |No| Fallback["Fallback to http://localhost:8000/api"]
UseEnv --> Normalize["Normalize trailing slashes"]
Fallback --> Normalize
Normalize --> CreateClient["Create Axios instances"]
CreateClient --> Interceptors["Attach auth token if present"]
Interceptors --> Ready(["Ready to make requests"])
```

**Diagram sources**
- [src/api/client.js:8-19](file://src/api/client.js#L8-L19)
- [src/api/client.js:47-52](file://src/api/client.js#L47-L52)
- [src/api/client.js:58-64](file://src/api/client.js#L58-L64)

Operational notes:
- In production builds, missing VITE_API_BASE_URL throws an error to prevent accidental calls to localhost.
- During development, the fallback ensures the app works out-of-the-box with a local backend.

**Section sources**
- [vite.config.js:5-23](file://vite.config.js#L5-L23)
- [src/config/config.js:1-3](file://src/config/config.js#L1-L3)
- [src/api/client.js:8-19](file://src/api/client.js#L8-L19)
- [src/pages/TERPLogin.jsx:7-12](file://src/pages/TERPLogin.jsx#L7-L12)
- [src/pages/TERPLogin.jsx:118-120](file://src/pages/TERPLogin.jsx#L118-L120)

### Development Server Setup and Proxy Configuration
- /api proxy:
  - Target: http://localhost:8000
  - changeOrigin: true
- /terp-api proxy:
  - Target: https://activate.imcbs.com
  - changeOrigin: true, secure: true
  - Rewrites paths by removing the /terp-api prefix before forwarding

```mermaid
flowchart TD
Req["Browser request '/api' or '/terp-api'"] --> Match{"Path matches proxy rule?"}
Match --> |/api| Local["Forward to http://localhost:8000"]
Match --> |/terp-api| Remote["Forward to https://activate.imcbs.com<br/>Rewrite path"]
Local --> Resp["Response back to browser"]
Remote --> Resp
```

**Diagram sources**
- [vite.config.js:7-21](file://vite.config.js#L7-L21)

**Section sources**
- [vite.config.js:7-21](file://vite.config.js#L7-L21)

### Production Build Optimizations
- Scripts:
  - build: vite build
  - preview: vite preview
- Behavior:
  - Vite performs standard production optimizations (minification, tree-shaking, etc.).
  - Environment variables are baked into the bundle at build time.
  - Missing required environment variables can cause build-time errors (e.g., VITE_API_BASE_URL in production).

```mermaid
flowchart TD
Dev["npm run build"] --> ViteBuild["Vite production build"]
ViteBuild --> InjectEnv["Inject environment variables"]
InjectEnv --> Optimize["Optimize bundle"]
Optimize --> Output["dist output"]
Output --> Preview["npm run preview"]
```

**Diagram sources**
- [package.json:6-10](file://package.json#L6-L10)
- [src/api/client.js:10-16](file://src/api/client.js#L10-L16)

**Section sources**
- [package.json:6-10](file://package.json#L6-L10)
- [src/api/client.js:10-16](file://src/api/client.js#L10-L16)

### ESLint Configuration for Code Quality
- Extends:
  - @eslint/js recommended rules
  - eslint-plugin-react-hooks recommended rules
  - eslint-plugin-react-refresh Vite integration
- Globals:
  - Browser globals enabled
- Parser options:
  - JSX enabled
- Ignores:
  - dist directory

```mermaid
classDiagram
class ESLintConfig {
+files : "**/*.{js,jsx}"
+extends : ["js.recommended", "react-hooks.recommended", "react-refresh.vite"]
+languageOptions.globals : "browser"
+parserOptions.ecmaFeatures.jsx : true
+globalIgnores : ["dist"]
}
```

**Diagram sources**
- [eslint.config.js:7-21](file://eslint.config.js#L7-L21)

**Section sources**
- [eslint.config.js:1-22](file://eslint.config.js#L1-L22)

### Environment-Specific Settings and API Endpoints
- Centralized API base URL:
  - Uses VITE_API_URL with a default fallback.
- Axios client:
  - Reads VITE_API_BASE_URL; enforces its presence in production.
  - Normalizes base URL and attaches Authorization headers using Token scheme.
  - Clears tokens on 401 responses.
- TERP Login:
  - Uses different endpoints depending on environment:
    - Development: proxied /terp-api paths
    - Production: absolute URLs from VITE_TERP_PROJECTS_API_URL and VITE_TERP_LICENSE_CREATE_API_URL
  - Requires VITE_GOOGLE_CLIENT_ID for Google Sign-In.

```mermaid
sequenceDiagram
participant UI as "TERPLogin UI"
participant Env as "import.meta.env"
participant Fetch as "fetch()"
participant API as "T-ERP API"
UI->>Env : Read VITE_TERP_PROJECTS_API_URL or DEV path
UI->>Fetch : GET projects endpoint
Fetch->>API : HTTP request
API-->>Fetch : Projects payload
Fetch-->>UI : Render projects
UI->>Env : Read VITE_TERP_LICENSE_CREATE_API_URL or DEV path
UI->>Fetch : POST license creation
Fetch->>API : HTTP request
API-->>Fetch : Success/Failure
Fetch-->>UI : Show success/error
```

**Diagram sources**
- [src/pages/TERPLogin.jsx:7-12](file://src/pages/TERPLogin.jsx#L7-L12)
- [src/pages/TERPLogin.jsx:94-112](file://src/pages/TERPLogin.jsx#L94-L112)
- [src/pages/TERPLogin.jsx:161-189](file://src/pages/TERPLogin.jsx#L161-L189)

**Section sources**
- [src/config/config.js:1-3](file://src/config/config.js#L1-L3)
- [src/api/client.js:8-19](file://src/api/client.js#L8-L19)
- [src/api/client.js:47-75](file://src/api/client.js#L47-L75)
- [src/pages/TERPLogin.jsx:7-12](file://src/pages/TERPLogin.jsx#L7-L12)
- [src/pages/TERPLogin.jsx:118-120](file://src/pages/TERPLogin.jsx#L118-L120)

### API Client Authentication Flow
- Token storage:
  - Supports localStorage and sessionStorage based on “remember” flag.
- Interceptors:
  - Adds Authorization header with Token scheme when token exists.
  - Clears token on 401 responses.

```mermaid
flowchart TD
Start(["Request created"]) --> GetToken["Get stored token"]
GetToken --> HasToken{"Token exists?"}
HasToken --> |Yes| AddHeader["Add 'Authorization: Token <key>'"]
HasToken --> |No| SkipHeader["Skip auth header"]
AddHeader --> Send["Send request"]
SkipHeader --> Send
Send --> Response{"Status 401?"}
Response --> |Yes| ClearToken["Clear stored token"]
Response --> |No| Continue["Continue response"]
ClearToken --> Reject["Reject promise"]
Continue --> Done(["Done"])
Reject --> Done
```

**Diagram sources**
- [src/api/client.js:26-42](file://src/api/client.js#L26-L42)
- [src/api/client.js:58-75](file://src/api/client.js#L58-L75)

**Section sources**
- [src/api/client.js:26-42](file://src/api/client.js#L26-L42)
- [src/api/client.js:58-75](file://src/api/client.js#L58-L75)

## Dependency Analysis
- Vite depends on @vitejs/plugin-react for React support.
- ESLint depends on js, react-hooks, react-refresh, and globals packages.
- Application dependencies include axios for HTTP requests and React ecosystem packages.

```mermaid
graph LR
Vite["vite.config.js"] --> Plugin["@vitejs/plugin-react"]
ESLint["eslint.config.js"] --> Rules["@eslint/js, react-hooks, react-refresh, globals"]
App["Application"] --> Axios["axios"]
App --> React["react, react-dom"]
```

**Diagram sources**
- [vite.config.js:1-2](file://vite.config.js#L1-L2)
- [eslint.config.js:1-5](file://eslint.config.js#L1-L5)
- [package.json:12-30](file://package.json#L12-L30)

**Section sources**
- [package.json:12-30](file://package.json#L12-L30)
- [vite.config.js:1-2](file://vite.config.js#L1-L2)
- [eslint.config.js:1-5](file://eslint.config.js#L1-L5)

## Performance Considerations
- Development:
  - Use the dev server with hot module replacement (HMR) via Vite.
  - Keep proxy rules minimal and targeted to reduce overhead.
- Production:
  - Ensure all required environment variables are set to avoid runtime failures.
  - Leverage Vite’s default production optimizations (minification, tree-shaking).
  - Avoid unnecessary large assets; consider lazy loading routes where applicable.
- API layer:
  - Reuse Axios instances to minimize overhead.
  - Handle 401 responses gracefully to clear stale tokens.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common environment-related issues and resolutions:

- API calls fail in development:
  - Verify that the local backend is running on the expected port.
  - Confirm that /api proxy target matches your backend host and port.
  - Ensure CORS is allowed on the backend for the dev origin.

- Remote T-ERP endpoints not reachable:
  - Check network connectivity to https://activate.imcbs.com.
  - Validate that /terp-api rewrite logic matches the backend path expectations.

- Production build fails due to missing environment variables:
  - Set VITE_API_BASE_URL in your production environment file.
  - Rebuild after updating environment variables.

- Google Sign-In does not load:
  - Ensure VITE_GOOGLE_CLIENT_ID is set in the appropriate environment file.
  - Verify that the Google Identity Services script loads successfully.

- Token authentication returns 401 repeatedly:
  - Confirm that the Authorization header uses the Token scheme (not Bearer).
  - Check that the backend expects the same token format and key name.

- Environment files not loaded:
  - Confirm that environment files (.env, .env.development, .env.production) exist and are named correctly.
  - Remember that Vite injects variables at build time; changes require rebuilding for production.

**Section sources**
- [vite.config.js:7-21](file://vite.config.js#L7-L21)
- [src/api/client.js:10-19](file://src/api/client.js#L10-L19)
- [src/pages/TERPLogin.jsx:118-120](file://src/pages/TERPLogin.jsx#L118-L120)
- [.gitignore:9-13](file://.gitignore#L9-L13)

## Conclusion
This application uses Vite’s environment variable injection to configure API endpoints and third-party integrations across environments. The dev server proxies API calls to simplify local development, while production builds enforce required environment variables to ensure correct deployment. ESLint provides consistent code quality checks. By following the environment setup guidelines and troubleshooting steps, you can reliably configure development, staging, and production environments and maintain a smooth developer experience.

[No sources needed since this section summarizes without analyzing specific files]