# Configuration and Environment

<cite>
**Referenced Files in This Document**
- [vite.config.js](file://vite.config.js)
- [eslint.config.js](file://eslint.config.js)
- [package.json](file://package.json)
- [src/config/config.js](file://src/config/config.js)
- [src/config/projectFlags.js](file://src/config/projectFlags.js)
- [src/api/client.js](file://src/api/client.js)
- [src/api/notifications.js](file://src/api/notifications.js)
- [src/api/proxy.js](file://src/api/proxy.js)
- [src/api/companyMaster.js](file://src/api/companyMaster.js)
- [deploy/nginx-cors-proxy.conf](file://deploy/nginx-cors-proxy.conf)
- [mailer/send.php](file://mailer/send.php)
- [src/pages/TERPLogin.jsx](file://src/pages/TERPLogin.jsx)
- [.gitignore](file://.gitignore)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive nginx proxy configuration documentation for Central Master API endpoints
- Updated development server setup to include Central Master API proxy configuration
- Enhanced API client documentation with new proxy utilities for Central Master integration
- Added company registration functionality documentation
- Updated environment variable configuration to support Central Master API endpoints
- Expanded deployment configuration section with nginx proxy setup instructions

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
- Development server setup and API proxying (including Central Master API)
- Production build behavior and optimizations
- Nginx proxy configuration for Central Master API endpoints
- ESLint configuration for code quality
- Project flags configuration for T-ERP product mapping
- Backend mailer integration for SMTP relay functionality
- Company registration functionality via Central Master API
- Environment-specific settings and API endpoints
- Deployment considerations and common troubleshooting steps

The project uses Vite with React, Axios-based API clients, and a flat ESLint configuration. Environment variables are injected at build time via Vite's import.meta.env system. The application now includes comprehensive proxy support for both T-ERP and Central Master APIs through both development and production environments.

## Project Structure
Configuration-related files are centralized:
- Build tooling: vite.config.js, package.json scripts
- Linting: eslint.config.js
- Runtime configuration: src/config/config.js
- Project flags mapping: src/config/projectFlags.js
- API client configuration: src/api/client.js
- Proxy utilities: src/api/proxy.js
- Company registration: src/api/companyMaster.js
- Nginx deployment: deploy/nginx-cors-proxy.conf
- Mailer integration: mailer/send.php, src/api/notifications.js
- Feature-specific environment usage: src/pages/TERPLogin.jsx
- Environment file handling: .gitignore

```mermaid
graph TB
A["Developer"] --> B["Vite Dev Server<br/>vite.config.js"]
B --> C["Proxy /api → Local Backend"]
B --> D["Proxy /terp-api → Remote T-ERP"]
B --> E["Proxy /central-api → Central Master"]
F["Production Build<br/>package.json scripts"] --> G["Nginx Proxy<br/>deploy/nginx-cors-proxy.conf"]
G --> H["Remote T-ERP API"]
G --> I["Central Master API"]
J["ESLint<br/>eslint.config.js"] --> K["Code Quality Checks"]
L["Environment Variables<br/>.env, .env.*"] --> M["import.meta.env"]
M --> N["API Base URL<br/>src/config/config.js"]
M --> O["Axios Client<br/>src/api/client.js"]
M --> P["TERP Endpoints<br/>src/pages/TERPLogin.jsx"]
M --> Q["Project Flags<br/>src/config/projectFlags.js"]
M --> R["Mailer Config<br/>src/api/notifications.js"]
M --> S["Proxy Utilities<br/>src/api/proxy.js"]
S --> T["Company Registration<br/>src/api/companyMaster.js"]
R --> U["PHP Mailer<br/>mailer/send.php"]
```

**Diagram sources**
- [vite.config.js:5-33](file://vite.config.js#L5-L33)
- [package.json:6-10](file://package.json#L6-L10)
- [eslint.config.js:7-21](file://eslint.config.js#L7-L21)
- [src/config/config.js:1-3](file://src/config/config.js#L1-L3)
- [src/config/projectFlags.js:1-53](file://src/config/projectFlags.js#L1-L53)
- [src/api/client.js:8-19](file://src/api/client.js#L8-L19)
- [src/api/notifications.js:22-26](file://src/api/notifications.js#L22-L26)
- [src/api/proxy.js:11-15](file://src/api/proxy.js#L11-L15)
- [src/api/companyMaster.js:11-15](file://src/api/companyMaster.js#L11-L15)
- [deploy/nginx-cors-proxy.conf:25-51](file://deploy/nginx-cors-proxy.conf#L25-L51)
- [mailer/send.php:1-257](file://mailer/send.php#L1-L257)
- [src/pages/TERPLogin.jsx:7-12](file://src/pages/TERPLogin.jsx#L7-L12)

**Section sources**
- [vite.config.js:1-36](file://vite.config.js#L1-L36)
- [eslint.config.js:1-22](file://eslint.config.js#L1-L22)
- [package.json:1-33](file://package.json#L1-L33)

## Core Components
- Vite configuration defines plugins, dev server, and API proxies including Central Master API.
- Nginx proxy configuration provides production proxy support for Central Master API endpoints.
- ESLint configuration sets recommended rules for JS/JSX and React hooks.
- Environment variables are consumed via import.meta.env across the app.
- API client centralizes base URLs, token handling, and interceptors.
- Proxy utilities provide unified access to both T-ERP and Central Master APIs.
- Company registration functionality enables statutory company details management.
- Project flags configuration maps T-ERP projects to product flags.
- Mailer integration provides SMTP relay functionality via PHP script.
- TERP login page uses environment variables for Google Sign-In and remote endpoints.

Key responsibilities:
- vite.config.js: Dev server and proxy rules for local development
- deploy/nginx-cors-proxy.conf: Production proxy configuration for Central Master API
- eslint.config.js: Linting rules and globals
- src/config/config.js: Centralized API base URL
- src/config/projectFlags.js: T-ERP project to product flag mapping
- src/api/client.js: Authenticated and public Axios instances
- src/api/proxy.js: Unified proxy utilities for Central Master and T-ERP APIs
- src/api/companyMaster.js: Company registration and management
- src/api/notifications.js: Email delivery orchestration
- mailer/send.php: PHP SMTP relay implementation
- src/pages/TERPLogin.jsx: Environment-driven endpoints and Google client ID

**Section sources**
- [vite.config.js:5-33](file://vite.config.js#L5-L33)
- [deploy/nginx-cors-proxy.conf:25-51](file://deploy/nginx-cors-proxy.conf#L25-L51)
- [eslint.config.js:7-21](file://eslint.config.js#L7-L21)
- [src/config/config.js:1-3](file://src/config/config.js#L1-L3)
- [src/config/projectFlags.js:1-53](file://src/config/projectFlags.js#L1-L53)
- [src/api/client.js:8-19](file://src/api/client.js#L8-L19)
- [src/api/proxy.js:1-56](file://src/api/proxy.js#L1-L56)
- [src/api/companyMaster.js:1-165](file://src/api/companyMaster.js#L1-L165)
- [src/api/notifications.js:1-415](file://src/api/notifications.js#L1-L415)
- [mailer/send.php:1-257](file://mailer/send.php#L1-L257)
- [src/pages/TERPLogin.jsx:7-12](file://src/pages/TERPLogin.jsx#L7-L12)

## Architecture Overview
The runtime configuration flow relies on Vite injecting environment variables into the bundle. The API layer reads these variables to determine endpoints and authentication behavior. The enhanced proxy system now supports both T-ERP and Central Master APIs through unified proxy utilities. The Central Master API provides company registration functionality for statutory compliance, while the project flags system maps selected T-ERP projects to product flags for user-master API calls. The mailer integration provides secure email delivery through an SMTP relay.

```mermaid
sequenceDiagram
participant Dev as "Developer"
participant Vite as "Vite Dev Server"
participant Nginx as "Nginx Proxy"
participant App as "React App"
participant Proxy as "Dev Proxy"
participant API as "Backend API"
participant Central as "Central Master API"
participant Mailer as "PHP Mailer"
Dev->>Vite : npm run dev
Vite->>Proxy : Start dev server with proxy rules
App->>Proxy : Request "/api/..." or "/central-api/..."
Proxy->>API : Forward to local backend (localhost : 8000)
Proxy->>Central : Forward to Central Master API
API-->>Proxy : Response
Central-->>Proxy : Response
Proxy-->>App : Response
Note over App,Proxy : Same-origin during dev avoids CORS issues
App->>Nginx : Production requests to /central-api/...
Nginx->>Central : Forward to https : //centralmastermanagement.imcbs.com
Central-->>Nginx : Response
Nginx-->>App : Response
App->>Mailer : POST credentials email
Mailer->>SMTP : Send via Hostinger SMTP
SMTP-->>Mailer : Delivery confirmation
Mailer-->>App : Email sent successfully
```

**Diagram sources**
- [vite.config.js:7-32](file://vite.config.js#L7-L32)
- [deploy/nginx-cors-proxy.conf:25-51](file://deploy/nginx-cors-proxy.conf#L25-L51)
- [src/api/proxy.js:11-15](file://src/api/proxy.js#L11-L15)
- [src/api/notifications.js:363-399](file://src/api/notifications.js#L363-L399)
- [mailer/send.php:204-243](file://mailer/send.php#L204-L243)

## Detailed Component Analysis

### Vite Configuration and Environment Variables
- Plugins: React plugin is enabled.
- Dev server:
  - Proxies /api to a local backend (default localhost:8000).
  - Proxies /terp-api to a remote T-ERP endpoint with secure HTTPS and path rewriting.
  - Proxies /central-api to Central Master API for company registration and master data management.
- Environment variables:
  - VITE_API_URL used by src/config/config.js.
  - VITE_API_BASE_URL used by src/api/client.js.
  - VITE_TERP_PROJECTS_API_URL and VITE_TERP_LICENSE_CREATE_API_URL used by src/pages/TERPLogin.jsx.
  - VITE_GOOGLE_CLIENT_ID used by src/pages/TERPLogin.jsx.
  - VITE_MAIL_API_URL and VITE_MAIL_API_TOKEN used by src/api/notifications.js for mailer integration.
  - VITE_COMPANY_MASTER_API_URL used by src/api/companyMaster.js for Central Master API access.

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
- Central Master API calls automatically route through the /central-api proxy prefix.

**Section sources**
- [vite.config.js:5-33](file://vite.config.js#L5-L33)
- [src/config/config.js:1-3](file://src/config/config.js#L1-L3)
- [src/api/client.js:8-19](file://src/api/client.js#L8-L19)
- [src/pages/TERPLogin.jsx:7-12](file://src/pages/TERPLogin.jsx#L7-L12)
- [src/pages/TERPLogin.jsx:118-120](file://src/pages/TERPLogin.jsx#L118-L120)

### Nginx Proxy Configuration for Central Master API
The nginx proxy configuration provides production support for Central Master API endpoints, enabling company registration functionality without CORS issues.

```mermaid
flowchart TD
Browser["Browser Request"] --> Nginx["Nginx Server"]
Nginx --> TerpProxy["/terp-api/ → activate.imcbs.com"]
Nginx --> CentralProxy["/central-api/ → centralmastermanagement.imcbs.com"]
TerpProxy --> TERP["T-ERP API"]
CentralProxy --> CENTRAL["Central Master API"]
CENTRAL --> CompanyReg["Company Registration"]
```

**Diagram sources**
- [deploy/nginx-cors-proxy.conf:25-51](file://deploy/nginx-cors-proxy.conf#L25-L51)

Key features:
- **Dual API Support**: Handles both T-ERP and Central Master API endpoints
- **CORS Bypass**: Routes requests through same-origin prefixes to avoid browser CORS restrictions
- **SSL Termination**: Properly handles HTTPS connections to upstream servers
- **Header Management**: Sets appropriate headers for upstream communication
- **Timeout Configuration**: Configurable connection and read timeouts for reliability

**Section sources**
- [deploy/nginx-cors-proxy.conf:1-52](file://deploy/nginx-cors-proxy.conf#L1-L52)

### Proxy Utilities and Central Master Integration
The proxy utilities provide unified access to both T-ERP and Central Master APIs through a consistent interface.

```mermaid
flowchart TD
Request["API Request"] --> CheckOrigin{"Target Origin Check"}
CheckOrigin --> |T-ERP| TERPPrefix["Add /terp-api prefix"]
CheckOrigin --> |Central Master| CentralPrefix["Add /central-api prefix"]
CheckOrigin --> |Local| DirectAccess["Direct Access"]
TERPPrefix --> Proxy["Same-Origin Proxy"]
CentralPrefix --> Proxy
DirectAccess --> Response["Response"]
Proxy --> Response
```

**Diagram sources**
- [src/api/proxy.js:26-36](file://src/api/proxy.js#L26-L36)

Key components:
- **TERP_ORIGIN**: Base URL for T-ERP services
- **CENTRAL_ORIGIN**: Base URL for Central Master services
- **TERP_PROXY_PREFIX**: Proxy prefix for T-ERP API (/terp-api)
- **CENTRAL_PROXY_PREFIX**: Proxy prefix for Central Master API (/central-api)
- **viaProxy()**: Function that routes requests through appropriate proxy based on target origin
- **assertJson()**: Validates responses and detects missing proxy configuration

**Section sources**
- [src/api/proxy.js:1-56](file://src/api/proxy.js#L1-L56)

### Company Registration Functionality
The company registration system enables statutory company details management through the Central Master API.

```mermaid
sequenceDiagram
participant UI as "Company Registration UI"
participant API as "companyMaster.js"
participant Proxy as "Proxy Layer"
participant Central as "Central Master API"
UI->>API : ensureCompanyMaster(details)
API->>API : findCompanyMaster(clientId)
API->>Proxy : GET /central-api/api/company-master/
Proxy->>Central : Forward request
Central-->>Proxy : Existing records or empty list
Proxy-->>API : Response
alt Company exists
API-->>UI : {created : false, record}
else New company
API->>Proxy : POST /central-api/api/company-master/
Proxy->>Central : Submit company details
Central-->>Proxy : Success response
Proxy-->>API : Created record
API-->>UI : {created : true, record}
end
```

**Diagram sources**
- [src/api/companyMaster.js:156-162](file://src/api/companyMaster.js#L156-L162)

Key features:
- **Statutory Compliance**: Manages GSTIN, PAN, and full address information
- **Retry Logic**: Handles transient network failures with exponential backoff
- **Data Validation**: Ensures proper formatting of company details
- **Duplicate Prevention**: Prevents duplicate company registrations per client ID
- **Logo Support**: Handles base64-encoded company logos

**Section sources**
- [src/api/companyMaster.js:1-165](file://src/api/companyMaster.js#L1-L165)

### Project Flags Configuration System
The project flags system maps T-ERP projects to product flags expected by the Central Master's user-master API. This enables automatic feature activation based on purchased projects.

```mermaid
flowchart TD
Projects["Selected Projects"] --> MapEndpoint["Map api_endpoint to flag"]
Projects --> MapName["Map project name to flag"]
MapEndpoint --> Combine["Combine flags"]
MapName --> Combine
Combine --> Initialize["Initialize all flags to false"]
Initialize --> SetTrue["Set matching flags to true"]
SetTrue --> Return["Return flags object"]
```

**Diagram sources**
- [src/config/projectFlags.js:41-52](file://src/config/projectFlags.js#L41-L52)

Key components:
- USER_MASTER_FLAGS: Array of all supported product flags
- PROJECT_FLAG_BY_ENDPOINT: Mapping from API endpoints to flags
- PROJECT_FLAG_BY_NAME: Fallback mapping from project names to flags
- flagsForProjects(): Function that generates flags object from selected projects

**Section sources**
- [src/config/projectFlags.js:1-53](file://src/config/projectFlags.js#L1-L53)

### Backend Mailer Integration
The mailer integration provides secure email delivery through a PHP script that handles SMTP communication with Hostinger's mail service.

```mermaid
sequenceDiagram
participant Frontend as "Frontend App"
participant Mailer as "PHP Mailer"
participant SMTP as "Hostinger SMTP"
participant Recipient as "Email Recipient"
Frontend->>Mailer : POST /mailer/send.php with credentials
Mailer->>SMTP : Authenticate and send email
SMTP-->>Mailer : Delivery confirmation
Mailer-->>Frontend : Success response with message ID
SMTP->>Recipient : Deliver email
```

**Diagram sources**
- [src/api/notifications.js:363-399](file://src/api/notifications.js#L363-L399)
- [mailer/send.php:204-243](file://mailer/send.php#L204-L243)

Key features:
- Authentication via bearer token or X-Mail-Token header
- CORS support for frontend integration
- Secure SMTP connection with SSL verification
- Input validation and sanitization
- Error handling and status reporting

**Section sources**
- [src/api/notifications.js:22-26](file://src/api/notifications.js#L22-L26)
- [src/api/notifications.js:363-399](file://src/api/notifications.js#L363-L399)
- [mailer/send.php:1-257](file://mailer/send.php#L1-L257)

### Development Server Setup and Proxy Configuration
- /api proxy:
  - Target: http://localhost:8000
  - changeOrigin: true
- /terp-api proxy:
  - Target: https://activate.imcbs.com
  - changeOrigin: true, secure: true
  - Rewrites paths by removing the /terp-api prefix before forwarding
- /central-api proxy:
  - Target: https://centralmastermanagement.imcbs.com
  - changeOrigin: true, secure: true
  - Rewrites paths by removing the /central-api prefix before forwarding

```mermaid
flowchart TD
Req["Browser request '/api', '/terp-api', or '/central-api'"] --> Match{"Path matches proxy rule?"}
Match --> |/api| Local["Forward to http://localhost:8000"]
Match --> |/terp-api| Remote["Forward to https://activate.imcbs.com<br/>Rewrite path"]
Match --> |/central-api| Central["Forward to https://centralmastermanagement.imcbs.com<br/>Rewrite path"]
Local --> Resp["Response back to browser"]
Remote --> Resp
Central --> Resp
```

**Diagram sources**
- [vite.config.js:7-32](file://vite.config.js#L7-L32)

**Section sources**
- [vite.config.js:7-32](file://vite.config.js#L7-L32)

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
- Central Master API:
  - Automatically routes through /central-api proxy prefix in development
  - Supports custom VITE_COMPANY_MASTER_API_URL for direct access
  - Integrates with nginx proxy configuration for production
- Mailer integration:
  - Uses VITE_MAIL_API_URL for PHP mailer endpoint
  - Requires VITE_MAIL_API_TOKEN for authentication
  - Supports multiple email delivery methods (EmailJS, Gmail API, direct SMTP)

```mermaid
sequenceDiagram
participant UI as "TERPLogin UI"
participant Env as "import.meta.env"
participant Fetch as "fetch()"
participant API as "T-ERP API"
participant Central as "Central Master API"
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
  - Supports localStorage and sessionStorage based on "remember" flag.
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
  - Central Master API calls benefit from retry logic for improved reliability.
- Production:
  - Ensure all required environment variables are set to avoid runtime failures.
  - Leverage Vite's default production optimizations (minification, tree-shaking).
  - Avoid unnecessary large assets; consider lazy loading routes where applicable.
  - Configure nginx proxy timeouts appropriately for Central Master API calls.
- API layer:
  - Reuse Axios instances to minimize overhead.
  - Handle 401 responses gracefully to clear stale tokens.
  - Utilize proxy utilities for efficient routing between different API origins.
- Central Master integration:
  - Implement retry logic for network resilience against distributed API instances.
  - Cache company registration data to reduce redundant API calls.
  - Use efficient payload construction for company registration submissions.
- Mailer integration:
  - Use the PHP mailer relay instead of direct SMTP connections from the browser.
  - Implement proper error handling for mail delivery failures.
- Project flags:
  - Cache project flag mappings to avoid repeated calculations.
  - Use efficient flag comparison algorithms for large project lists.

## Troubleshooting Guide
Common environment-related issues and resolutions:

- API calls fail in development:
  - Verify that the local backend is running on the expected port.
  - Confirm that /api proxy target matches your backend host and port.
  - Ensure CORS is allowed on the backend for the dev origin.

- Central Master API calls not working:
  - Check that /central-api proxy is properly configured in vite.config.js for development.
  - Verify nginx proxy configuration in deploy/nginx-cors-proxy.conf for production.
  - Ensure the Central Master API is accessible and responding correctly.

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

- Project flags not working correctly:
  - Verify that selected projects have valid api_endpoint or project name fields.
  - Check that the project flag mappings in projectFlags.js match your T-ERP project structure.
  - Ensure the user-master API accepts the generated flag combinations.

- Mail delivery fails:
  - Verify that VITE_MAIL_API_URL points to the correct mailer endpoint.
  - Check that VITE_MAIL_API_TOKEN matches the token configured in mailer/send.php.
  - Ensure the PHP mailer script is accessible and has proper file permissions.
  - Validate that the Hostinger SMTP credentials in mailer/send.php are correct.
  - Check CORS configuration if the mailer is hosted on a different domain.

- Company registration not working:
  - Verify that VITE_COMPANY_MASTER_API_URL is correctly configured if using direct access.
  - Check that nginx proxy configuration includes the /central-api location block.
  - Ensure the Central Master API is accessible and responding to company registration requests.
  - Validate that company registration payloads meet the expected format requirements.
  - Check for proper error handling in company registration API calls.

- Nginx proxy configuration issues:
  - Verify that the nginx configuration file is properly included in the server block.
  - Check that the proxy locations are defined before the SPA try_files directive.
  - Ensure proper SSL certificate configuration for HTTPS connections.
  - Validate DNS resolution for upstream hosts (activate.imcbs.com, centralmastermanagement.imcbs.com).
  - Check nginx error logs for proxy-related errors.

**Section sources**
- [vite.config.js:7-32](file://vite.config.js#L7-L32)
- [deploy/nginx-cors-proxy.conf:25-51](file://deploy/nginx-cors-proxy.conf#L25-L51)
- [src/api/client.js:10-19](file://src/api/client.js#L10-L19)
- [src/pages/TERPLogin.jsx:118-120](file://src/pages/TERPLogin.jsx#L118-L120)
- [.gitignore:9-13](file://.gitignore#L9-L13)
- [src/config/projectFlags.js:41-52](file://src/config/projectFlags.js#L41-L52)
- [src/api/notifications.js:363-399](file://src/api/notifications.js#L363-L399)
- [src/api/companyMaster.js:11-15](file://src/api/companyMaster.js#L11-L15)
- [mailer/send.php:28-37](file://mailer/send.php#L28-L37)

## Conclusion
This application uses Vite's environment variable injection to configure API endpoints and third-party integrations across environments. The enhanced proxy system now provides comprehensive support for both T-ERP and Central Master APIs through unified proxy utilities. The development server proxies API calls to simplify local development, while production builds leverage nginx proxy configuration to handle Central Master API endpoints without CORS issues. The company registration functionality enables statutory compliance management through the Central Master API. ESLint provides consistent code quality checks. The project flags system enables automatic feature activation based on purchased T-ERP projects, and the mailer integration provides secure email delivery through an SMTP relay. By following the environment setup guidelines and troubleshooting steps, you can reliably configure development, staging, and production environments and maintain a smooth developer experience across all integrated services.