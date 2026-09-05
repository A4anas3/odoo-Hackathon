# Centralized Authentication & Authorization Microservice

A standalone, self-hosted Auth microservice (Supabase Auth / Auth0-style) built with
**Spring Boot 3, Spring Security, JWT (RS256), PostgreSQL, and JPA**.

This repository contains **two independent Maven projects**:

```
.
├── auth-service/                  # The central identity service (owns users, roles, tokens)
├── downstream-service-example/    # Example resource microservice — validates JWTs only
├── docs/                          # Architecture diagrams + DB schema reference
└── docker-compose.full.yml        # Runs Postgres + both services together
```

`auth-service` is the **only** service that touches user data. Every other
microservice in your system should look like `downstream-service-example`:
it has no users table, no roles table, no login endpoint — it just verifies
the JWT signature with the auth-service's **public** key and reads the `roles`
claim.

---

## 1. Quick start (Docker Compose)

```bash
docker compose -f docker-compose.full.yml up --build
```

This starts:
| Service                 | Port | Purpose                                  |
|--------------------------|------|-------------------------------------------|
| postgres                 | 5432 | Auth database                             |
| auth-service              | 8080 | Register/login/refresh/RBAC admin APIs    |
| downstream-service-example| 8081 | Demo resource service consuming the JWT   |

RSA keys are pre-generated and checked in under `auth-service/src/main/resources/keys/`
(and the **public** key is copied into `downstream-service-example`) purely so the demo
runs out of the box. **Rotate these keys before using this in production** — see
[Section 6](#6-production-checklist).

## 2. Running locally without Docker

```bash
cd auth-service
mvn spring-boot:run
```

Requires a local PostgreSQL with a database `authdb` (or point
`SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` at your own instance).
Flyway creates the schema automatically on first boot.

---

## 3. API Reference

### Public endpoints (`auth-service`, port 8080)

| Method | Path                     | Description                                   |
|--------|--------------------------|------------------------------------------------|
| POST   | `/auth/register`         | Create a new user (default role: `USER`)       |
| POST   | `/auth/login`            | Authenticate, returns access + refresh token    |
| POST   | `/auth/refresh`          | Rotate a refresh token for a new token pair     |
| POST   | `/auth/logout`           | Revoke a refresh token                          |
| GET    | `/auth/me`               | Return the current authenticated user (JWT req.)|
| POST   | `/auth/change-password`  | Change password while logged in (JWT req.)      |
| POST   | `/auth/forgot-password`  | Request a password reset token                  |
| POST   | `/auth/reset-password`   | Reset password using a reset token              |

### Admin endpoints (require `ROLE_ADMIN`)

| Method | Path                                    | Description                |
|--------|------------------------------------------|-----------------------------|
| POST   | `/admin/roles`                           | Create a new role           |
| GET    | `/admin/roles`                           | List all roles              |
| POST   | `/admin/users/{userId}/roles`            | Assign a role to a user     |
| DELETE | `/admin/users/{userId}/roles/{roleName}` | Remove a role from a user   |
| GET    | `/admin/users`                           | List all users (paginated)  |
| GET    | `/admin/users/{userId}`                  | Get a single user            |

### Example curl walkthrough

```bash
# 1. Register
curl -X POST localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","username":"alice","password":"Passw0rd123"}'

# 2. Login
curl -X POST localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Passw0rd123"}'
# => { "accessToken": "...", "refreshToken": "...", "tokenType": "Bearer", "expiresInSeconds": 900 }

# 3. Call a protected endpoint
curl localhost:8080/auth/me -H "Authorization: Bearer <accessToken>"

# 4. Refresh (rotates the refresh token — old one is invalidated)
curl -X POST localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# 5. Logout (revokes the refresh token)
curl -X POST localhost:8080/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# 6. As an ADMIN, promote alice to MANAGER
curl -X POST localhost:8080/admin/users/<alice_user_id>/roles \
  -H "Authorization: Bearer <admin_accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"roleName":"MANAGER"}'

# 7. Call the downstream example service with alice's token
curl localhost:8081/orders -H "Authorization: Bearer <accessToken>"
curl localhost:8081/orders/manager-dashboard -H "Authorization: Bearer <accessToken>"
```

> **Bootstrapping the first ADMIN**: the schema seeds the `ADMIN`, `MANAGER`, and `USER`
> roles, but no user starts as ADMIN. Register a user normally, then either (a) run a
> one-off SQL `INSERT INTO user_roles ...` for that user's id + the ADMIN role id, or
> (b) temporarily relax `SecurityConfig` to allow the first `/admin/users/{id}/roles`
> call. Automate this via a Flyway seed migration or an admin CLI in production.

---

## 4. JWT shape

Access token claims (RS256-signed, verifiable with the public key only):

```json
{
  "sub": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "alice@example.com",
  "roles": ["ADMIN", "USER"],
  "type": "access",
  "iss": "auth-service",
  "iat": 1735689600,
  "exp": 1735690500,
  "jti": "b3b4a9b0-....."
}
```

Refresh tokens are **opaque, high-entropy random strings** — not JWTs. Only their
SHA-256 hash is ever persisted (`refresh_tokens.token_hash`), so a stolen database
dump alone cannot be replayed as a session. See `RefreshTokenService` for the full
rotation + reuse-detection logic.

---

## 5. How a NEW downstream microservice should consume this

1. Copy these three files from `downstream-service-example`:
   - `security/JwtValidationFilter.java`
   - `security/RsaPublicKeyLoader.java`
   - `config/JwtKeyConfig.java` + `config/JwtProperties.java`
2. Copy `auth-service`'s **public key only** (`public_key.pem`) — never the private key.
3. Wire the filter into your own `SecurityConfig` (see the example's `SecurityConfig.java`)
   and add `@EnableMethodSecurity(prePostEnabled = true)`.
4. Use `@PreAuthorize("hasRole('ADMIN')")` / `hasAnyRole(...)` on your controllers exactly
   as you would in a monolith — the roles come from the JWT claim, not a local DB.
5. In production, consider exposing `GET /.well-known/jwks.json` from `auth-service`
   (a small addition) so downstream services can fetch/rotate the public key
   automatically instead of manually copying a `.pem` file.

This is the entire integration surface. Downstream services **never** call
auth-service synchronously to validate a token — verification is 100% local,
CPU-only, and adds no network latency.

---

## 6. Production checklist

- [ ] Generate fresh RSA keys per environment; store the private key in a secrets
      manager (Vault, AWS Secrets Manager, etc.), never in source control.
- [ ] Serve the public key via a `/.well-known/jwks.json` endpoint with key-rotation
      support (`kid` header) instead of static file distribution.
- [ ] Put `auth-service` behind TLS everywhere; refresh tokens and reset tokens must
      never be logged or transmitted over plaintext HTTP.
- [ ] Send password-reset tokens by email (out-of-band) — `AuthService.forgotPassword`
      is written to return `null` externally; wire in a real mail/notification service.
  and never log/return the raw token in production.
- [ ] Add rate limiting on `/auth/login`, `/auth/forgot-password`, and `/auth/refresh`
      to slow down brute-force and credential-stuffing attempts.
- [ ] Add account lockout / exponential backoff after repeated failed logins.
- [ ] Restrict CORS `allowedOriginPatterns` in `SecurityConfig` to your real origins.
- [ ] Consider short-lived JWKS caching + key rotation windows if you rotate keys.
- [ ] Add structured audit logging for admin actions (role grants/revokes).

---

## 7. Project layout (auth-service)

```
auth-service/src/main/java/com/authservice/
├── AuthServiceApplication.java
├── config/          # SecurityConfig, JwtKeyConfig, JwtProperties
├── controller/       # AuthController, AdminController
├── dto/
│   ├── request/      # RegisterRequest, LoginRequest, ...
│   └── response/     # TokenResponse, UserResponse, RoleResponse, ApiErrorResponse
├── entity/           # User, Role, RefreshToken, PasswordResetToken
├── exception/        # ApiException hierarchy + GlobalExceptionHandler
├── repository/        # Spring Data JPA repositories
├── security/          # JwtTokenProvider, JwtAuthenticationFilter, UserPrincipal, ...
├── service/           # AuthService, UserService, RoleService, RefreshTokenService
└── util/              # RsaKeyLoader, TokenHashUtil
```

See `docs/architecture-and-flow.md` for sequence diagrams and `docs/database-schema.sql`
for the full DDL (also applied automatically via Flyway on boot).
