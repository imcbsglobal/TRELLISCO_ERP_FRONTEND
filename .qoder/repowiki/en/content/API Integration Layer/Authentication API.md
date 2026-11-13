# Authentication API

<cite>
**Referenced Files in This Document**
- [auth.js](file://src/api/auth.js)
- [client.js](file://src/api/client.js)
- [userMaster.js](file://src/api/userMaster.js)
- [Login.jsx](file://src/pages/AdminDashboard/Login.jsx)
- [App.jsx](file://src/App.jsx)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for userMaster.js functionality including enhanced username generation
- Updated authentication flow documentation to include client admin account creation
- Enhanced security considerations with improved credential generation
- Added new sections for Central Master integration and client account management

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [User Management and Account Creation](#user-management-and-account-creation)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This document describes the authentication service endpoints and their integration within the frontend application. It covers login and logout flows, token acquisition and validation, session storage patterns, protected route enforcement, error handling for invalid credentials and expired tokens, and security considerations such as token expiration handling and secure storage practices. The backend endpoints are called from the frontend; this documentation focuses on how the frontend consumes them and manages sessions. Additionally, it documents the enhanced user management system that creates client administrator accounts with improved username generation and client country binding capabilities.

## Project Structure
The authentication-related code is organized into:
- API layer: HTTP client configuration, token helpers, authentication functions, and user management utilities.
- UI layer: Login page and protected routes.
- Configuration: Base URL for API calls.

```mermaid
graph TB
subgraph "Frontend"
A["src/api/client.js<br/>Axios instance + token helpers"]
B["src/api/auth.js<br/>login/logout/isAuthenticated/getCurrentUser"]
C["src/api/userMaster.js<br/>User management & account creation"]
D["src/pages/AdminDashboard/Login.jsx<br/>Login form UI"]
E["src/App.jsx<br/>Protected routes"]
end
subgraph "Backend"
F["/blog/admin/login/<br/>POST"]
G["/blog/admin/logout/<br/>POST"]
H["Central Master API<br/>User management endpoints"]
end
D --> B
B --> A
A --> F
A --> G
C --> H
E --> B
A --> E
```

**Diagram sources**
- [client.js:1-88](file://src/api/client.js#L1-L88)
- [auth.js:1-40](file://src/api/auth.js#L1-L40)
- [userMaster.js:1-315](file://src/api/userMaster.js#L1-L315)
- [Login.jsx:1-244](file://src/pages/AdminDashboard/Login.jsx#L1-L244)
- [App.jsx:1-74](file://src/App.jsx#L1-L74)

**Section sources**
- [client.js:1-88](file://src/api/client.js#L1-L88)
- [auth.js:1-40](file://src/api/auth.js#L1-L40)
- [userMaster.js:1-315](file://src/api/userMaster.js#L1-L315)
- [Login.jsx:1-244](file://src/pages/AdminDashboard/Login.jsx#L1-L244)
- [App.jsx:1-74](file://src/App.jsx#L1-L74)

## Core Components
- Token storage and request interceptor: Centralized in the Axios client with helpers to get/set/clear tokens. Tokens are stored in localStorage or sessionStorage depending on a remember flag.
- Authentication API functions: Provide login, logout, authentication state check, and current user retrieval.
- User management utilities: Enhanced username generation from email addresses, secure password generation, and client admin account creation with collision handling.
- Login UI: Collects email/password, handles errors, and navigates after successful login.
- Protected routes: Enforce authentication using an authentication guard.

Key responsibilities:
- Acquire token on login and attach it to subsequent requests.
- Clear token on 401 responses (expired/invalid).
- Persist user profile alongside token based on remember flag.
- Guard admin routes by checking token presence.
- Generate secure usernames derived from email addresses with fallback mechanisms.
- Create client administrator accounts with proper validation and conflict resolution.

**Section sources**
- [client.js:21-42](file://src/api/client.js#L21-L42)
- [client.js:47-75](file://src/api/client.js#L47-L75)
- [auth.js:4-19](file://src/api/auth.js#L4-L19)
- [auth.js:21-29](file://src/api/auth.js#L21-L29)
- [auth.js:31-40](file://src/api/auth.js#L31-L40)
- [userMaster.js:27-86](file://src/api/userMaster.js#L27-L86)
- [userMaster.js:241-312](file://src/api/userMaster.js#L241-L312)
- [Login.jsx:113-136](file://src/pages/AdminDashboard/Login.jsx#L113-L136)
- [App.jsx:15-17](file://src/App.jsx#L15-L17)

## Architecture Overview
The authentication flow uses Django REST Framework's TokenAuthentication scheme. The frontend sends credentials to a login endpoint, receives a token and user object, stores the token, and attaches it to all authenticated requests via an Axios interceptor. Logout clears server-side session and local storage. The user management system integrates with a Central Master API to create client administrator accounts with enhanced username generation and security features.

```mermaid
sequenceDiagram
participant User as "User"
participant UI as "Login.jsx"
participant Auth as "auth.js"
participant Client as "client.js"
participant UserMaster as "userMaster.js"
participant Backend as "Backend API"
participant CentralMaster as "Central Master API"
User->>UI : Enter email/password
UI->>Auth : login(email, password, {remember})
Auth->>Client : api.post("/blog/admin/login/", payload)
Client->>Backend : POST /blog/admin/login/
Backend-->>Client : {token, user}
Client-->>Auth : response.data
Auth->>Client : setToken(token, {remember})
Auth->>Auth : store user in storage
Auth-->>UI : user
UI->>UI : navigate to dashboard
Note over Client,Backend : All subsequent requests include Authorization : Token <key>
Note over UserMaster,CentralMaster : Admin account creation with enhanced username generation
```

**Diagram sources**
- [Login.jsx:113-136](file://src/pages/AdminDashboard/Login.jsx#L113-L136)
- [auth.js:4-19](file://src/api/auth.js#L4-L19)
- [client.js:54-64](file://src/api/client.js#L54-L64)
- [userMaster.js:241-312](file://src/api/userMaster.js#L241-L312)

## Detailed Component Analysis

### Authentication Endpoints
- POST /blog/admin/login/
  - Purpose: Authenticate user and return token and user profile.
  - Request body: email, password.
  - Response data: token, user.
  - Behavior: Frontend stores token and user profile according to remember flag.
- POST /blog/admin/logout/
  - Purpose: Invalidate server-side session and clear local token/user data.
  - Response: No specific body required; frontend clears storage regardless.

Request/response schemas:
- Login request
  - Fields:
    - email: string
    - password: string
- Login response
  - Fields:
    - token: string
    - user: object
- Logout request
  - No body required.

Error handling:
- Invalid credentials: Backend returns 401 with detail message; frontend displays backend-provided message.
- Expired/invalid token: Interceptor clears token on 401 responses.

Security notes:
- Token scheme: Authorization header uses "Token <key>" (not "Bearer").
- Storage: Token stored in localStorage when remember is true; otherwise sessionStorage.
- User profile: Stored alongside token in the same storage type.

**Section sources**
- [auth.js:4-19](file://src/api/auth.js#L4-L19)
- [auth.js:21-29](file://src/api/auth.js#L21-L29)
- [client.js:54-75](file://src/api/client.js#L54-L75)
- [Login.jsx:124-136](file://src/pages/AdminDashboard/Login.jsx#L124-L136)

### Token Acquisition and Validation
- Acquisition: On successful login, the token is persisted via setToken with remember flag determining storage location.
- Validation: Every outgoing request includes Authorization header if a token exists. If backend responds with 401, the token is cleared automatically.

```mermaid
flowchart TD
Start(["Start Request"]) --> GetToken["Get token from storage"]
GetToken --> HasToken{"Token present?"}
HasToken --> |No| SendPublic["Send without Authorization"]
HasToken --> |Yes| AttachHeader["Attach 'Authorization: Token <key>'"]
AttachHeader --> SendAuth["Send authenticated request"]
SendAuth --> RespStatus{"Response status"}
RespStatus --> |2xx| Success["Return response"]
RespStatus --> |401| ClearToken["Clear token and reject"]
RespStatus --> |Other| OtherErr["Handle other errors"]
SendPublic --> End(["End"])
Success --> End
ClearToken --> End
OtherErr --> End
```

**Diagram sources**
- [client.js:54-75](file://src/api/client.js#L54-L75)

**Section sources**
- [client.js:21-42](file://src/api/client.js#L21-L42)
- [client.js:54-75](file://src/api/client.js#L54-L75)

### Session Management Patterns
- Remember me: When enabled, token and user profile are stored in localStorage; otherwise, sessionStorage is used.
- Current user: Retrieved from the same storage type where it was saved.
- Logout: Clears token and removes user profile from both localStorage and sessionStorage to ensure consistent cleanup.

Storage keys:
- Token key: trellisco_token
- Admin user key: trellisco_admin_user

Behavior summary:
- Login sets token and user in matching storage.
- isAuthenticated checks token presence.
- getCurrentUser reads user from matching storage.
- Logout clears both token and user entries.

**Section sources**
- [auth.js:10-18](file://src/api/auth.js#L10-L18)
- [auth.js:21-29](file://src/api/auth.js#L21-L29)
- [auth.js:31-40](file://src/api/auth.js#L31-L40)
- [client.js:21-42](file://src/api/client.js#L21-L42)

### Protected Route Integration
- RequireAuth component checks authentication state before rendering protected pages.
- Routes under /admin/* are guarded; unauthenticated users are redirected to /login.

```mermaid
sequenceDiagram
participant Router as "App.jsx"
participant Guard as "RequireAuth"
participant Auth as "isAuthenticated"
participant Page as "Admin Page"
Router->>Guard : Render protected route
Guard->>Auth : Check token
Auth-->>Guard : boolean
alt Authenticated
Guard-->>Router : Render Page
else Not authenticated
Guard-->>Router : Navigate to /login
end
```

**Diagram sources**
- [App.jsx:15-17](file://src/App.jsx#L15-L17)
- [App.jsx:35-66](file://src/App.jsx#L35-L66)
- [auth.js:31-33](file://src/api/auth.js#L31-L33)

**Section sources**
- [App.jsx:15-17](file://src/App.jsx#L15-L17)
- [App.jsx:35-66](file://src/App.jsx#L35-L66)
- [auth.js:31-33](file://src/api/auth.js#L31-L33)

### Logout Procedures
- Server call: Sends POST to /blog/admin/logout/.
- Cleanup: Clears token and removes user profile from both localStorage and sessionStorage.
- Error handling: Cleanup runs even if logout request fails.

```mermaid
flowchart TD
Start(["Logout invoked"]) --> CallServer["POST /blog/admin/logout/"]
CallServer --> FinallyBlock["Finally block"]
FinallyBlock --> ClearToken["clearToken()"]
ClearToken --> RemoveUserLocal["Remove user from localStorage"]
RemoveUserLocal --> RemoveUserSession["Remove user from sessionStorage"]
RemoveUserSession --> End(["Done"])
```

**Diagram sources**
- [auth.js:21-29](file://src/api/auth.js#L21-L29)

**Section sources**
- [auth.js:21-29](file://src/api/auth.js#L21-L29)

## User Management and Account Creation

### Enhanced Username Generation System
The user management system provides sophisticated username generation capabilities that derive usernames from email addresses while maintaining security and usability standards.

#### Email-Derived Username Generation
The `usernameFromEmail` function extracts the local part of an email address and transforms it into a valid username:

- Extracts text before "@" symbol
- Converts to lowercase for case-insensitive matching
- Removes special characters except dots, underscores, and hyphens
- Ensures username starts with a letter (prefixes with "u" if needed)
- Limits length to prevent conflicts with strict validators

#### Secure Password Generation
The `generatePassword` function creates strong passwords meeting complexity requirements:

- Includes uppercase letters, lowercase letters, digits, and symbols
- Uses cryptographically secure random number generation
- Implements Fisher-Yates shuffle for character distribution
- Supports configurable password length with minimum requirements

#### Collision Handling and Conflict Resolution
The system implements robust collision detection and resolution:

- Numbered suffixes for duplicate usernames (e.g., "username1", "username2")
- Contact uniqueness validation (email and phone number combinations)
- Client ID-based account scoping to prevent cross-client conflicts

```mermaid
flowchart TD
Start(["Create Client Admin"]) --> GenerateBase["Generate base username from email"]
GenerateBase --> CheckExisting["Check for existing accounts"]
CheckExisting --> HasConflict{"Username conflict?"}
HasConflict --> |Yes| NumberSuffix["Add numbered suffix"]
HasConflict --> |No| CreateAccount["Create account"]
NumberSuffix --> Retry["Retry with new username"]
Retry --> CheckExisting
CreateAccount --> Success["Account created successfully"]
```

**Diagram sources**
- [userMaster.js:241-312](file://src/api/userMaster.js#L241-L312)

### Central Master Integration
The system integrates with a Central Master API for client administrator account management:

- Development environment uses proxy configuration
- Production environment uses dedicated API endpoint
- Handles CORS restrictions through development proxy
- Supports both JSON and non-JSON error responses

### Client Country Binding
The user management system supports client-specific account isolation:

- Client ID-based account scoping prevents cross-client access
- Email and phone number uniqueness per client
- Support for legacy code-based client identification
- Automatic project flag propagation across client logins

**Section sources**
- [userMaster.js:27-86](file://src/api/userMaster.js#L27-L86)
- [userMaster.js:98-115](file://src/api/userMaster.js#L98-L115)
- [userMaster.js:117-131](file://src/api/userMaster.js#L117-L131)
- [userMaster.js:140-172](file://src/api/userMaster.js#L140-L172)
- [userMaster.js:182-215](file://src/api/userMaster.js#L182-L215)
- [userMaster.js:241-312](file://src/api/userMaster.js#L241-L312)

## Dependency Analysis
The authentication system has clear boundaries with enhanced user management capabilities:
- client.js provides the HTTP client and token management.
- auth.js depends on client.js for token operations and API calls.
- userMaster.js provides independent user management functionality with its own API calls.
- Login.jsx depends on auth.js for login logic and navigation.
- App.jsx depends on auth.js for route protection.

```mermaid
graph LR
Client["client.js"] --> Auth["auth.js"]
Auth --> LoginUI["Login.jsx"]
Auth --> AppRoutes["App.jsx"]
UserMaster["userMaster.js"] --> CentralMasterAPI["Central Master API"]
Config["config.js"] --> Client
```

**Diagram sources**
- [client.js:1-88](file://src/api/client.js#L1-L88)
- [auth.js:1-40](file://src/api/auth.js#L1-L40)
- [userMaster.js:1-315](file://src/api/userMaster.js#L1-L315)
- [Login.jsx:1-244](file://src/pages/AdminDashboard/Login.jsx#L1-L244)
- [App.jsx:1-74](file://src/App.jsx#L1-L74)

**Section sources**
- [client.js:1-88](file://src/api/client.js#L1-L88)
- [auth.js:1-40](file://src/api/auth.js#L1-L40)
- [userMaster.js:1-315](file://src/api/userMaster.js#L1-L315)
- [Login.jsx:1-244](file://src/pages/AdminDashboard/Login.jsx#L1-L244)
- [App.jsx:1-74](file://src/App.jsx#L1-L74)

## Performance Considerations
- Token lookup is O(1) per request due to direct storage access.
- Interceptors avoid unnecessary work by only attaching headers when a token exists.
- Logout cleanup ensures no stale data remains, preventing unnecessary re-authentication attempts.
- Username generation uses efficient string manipulation with minimal overhead.
- Central Master API calls are optimized with proper error handling and retry logic.

## Troubleshooting Guide
Common issues and resolutions:
- 401 Unauthorized on protected requests:
  - Cause: Missing, expired, or invalid token.
  - Resolution: Re-login; the interceptor clears tokens on 401 responses.
- Login fails with generic error:
  - Cause: Backend returns a detail message in the response body.
  - Resolution: Display backend detail message to the user.
- Requests not authenticated:
  - Cause: Authorization header missing or wrong scheme.
  - Resolution: Ensure Authorization header uses "Token <key>".
- Token persists across tabs unexpectedly:
  - Cause: Using localStorage when remember is true.
  - Resolution: Use sessionStorage by disabling remember or clearing storage.
- Username generation conflicts:
  - Cause: Email-derived username already exists.
  - Resolution: System automatically adds numbered suffixes; check for contact conflicts.
- Central Master API connection issues:
  - Cause: Network connectivity or CORS restrictions.
  - Resolution: Verify API endpoint configuration and development proxy setup.

**Section sources**
- [client.js:54-75](file://src/api/client.js#L54-L75)
- [Login.jsx:124-136](file://src/pages/AdminDashboard/Login.jsx#L124-L136)
- [userMaster.js:217-229](file://src/api/userMaster.js#L217-L229)

## Conclusion
The authentication system integrates cleanly with the frontend through a centralized Axios client that manages tokens and enforces authorization headers. Login and logout endpoints are straightforward, with robust cleanup and error handling. Protected routes rely on token presence, ensuring unauthorized access is blocked. The enhanced user management system provides sophisticated username generation from email addresses, secure password creation, and robust conflict resolution for client administrator account creation. For production, consider adding CSRF protection at the backend level, validating tokens server-side, and implementing refresh token strategies to improve security and user experience. The Central Master integration enables scalable client account management with proper isolation and security controls.