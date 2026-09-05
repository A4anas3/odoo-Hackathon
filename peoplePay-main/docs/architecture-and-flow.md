# Architecture & Authentication Flow

## 1. High-level architecture

```mermaid
flowchart LR
    subgraph Clients
        WebApp[Web / Mobile App]
    end

    subgraph AuthDomain [Auth Domain - owns identity]
        AuthSvc[auth-service<br/>Spring Boot]
        AuthDB[(PostgreSQL<br/>users, roles,<br/>user_roles,<br/>refresh_tokens)]
        AuthSvc --> AuthDB
    end

    subgraph BusinessDomain [Business Microservices - own NO identity data]
        Orders[orders-service]
        Payments[payments-service]
        Inventory[inventory-service]
    end

    WebApp -- "1. register / login" --> AuthSvc
    AuthSvc -- "2. access + refresh token (RS256)" --> WebApp
    WebApp -- "3. Authorization: Bearer <access_token>" --> Orders
    WebApp -- "3. Authorization: Bearer <access_token>" --> Payments
    WebApp -- "3. Authorization: Bearer <access_token>" --> Inventory

    AuthSvc -. "publishes public_key.pem<br/>(verification only,<br/>no network call at runtime)" .-> Orders
    AuthSvc -. "public_key.pem" .-> Payments
    AuthSvc -. "public_key.pem" .-> Inventory
```

Key point: after the public key is distributed once (config, secret manager, or a
`/.well-known/jwks.json` endpoint), **downstream services validate tokens locally**.
There is no synchronous call back to `auth-service` on the request hot path — this
keeps the auth-service decoupled and avoids it becoming a single point of failure /
latency bottleneck for every request in the system.

## 2. Login + token issuance

```mermaid
sequenceDiagram
    participant U as User / Client
    participant A as auth-service
    participant DB as PostgreSQL

    U->>A: POST /auth/login {email, password}
    A->>DB: SELECT user by email
    DB-->>A: user + password_hash + roles
    A->>A: BCrypt.matches(password, hash)
    A->>A: sign access_token (RS256, 15 min)<br/>claims: sub, email, roles
    A->>A: generate opaque refresh_token<br/>store SHA-256(refresh_token)
    A->>DB: INSERT refresh_tokens (hash, family_id, expires_at)
    A-->>U: 200 { accessToken, refreshToken }
```

## 3. Refresh token rotation (with reuse detection)

```mermaid
sequenceDiagram
    participant U as User / Client
    participant A as auth-service
    participant DB as PostgreSQL

    U->>A: POST /auth/refresh {refreshToken}
    A->>DB: SELECT by SHA-256(refreshToken)
    alt token not found
        A-->>U: 401 invalid token
    else token already revoked (REUSE!)
        A->>DB: revoke entire token family
        A-->>U: 401 reuse detected, please log in again
    else token expired
        A-->>U: 401 expired
    else token valid
        A->>DB: revoke old token, insert new token (same family_id)
        A->>A: sign new access_token
        A-->>U: 200 { new accessToken, new refreshToken }
    end
```

## 4. Downstream service validating a token (no DB call)

```mermaid
sequenceDiagram
    participant U as User / Client
    participant O as orders-service
    participant K as public_key.pem (local file/secret)

    U->>O: GET /orders/admin-report<br/>Authorization: Bearer <access_token>
    O->>K: verify RS256 signature
    O->>O: parse claims { sub, email, roles, exp }
    O->>O: check exp not passed
    O->>O: build GrantedAuthority list from "roles"
    O->>O: @PreAuthorize("hasRole('ADMIN')") check
    alt roles contains ADMIN and not expired
        O-->>U: 200 report data
    else
        O-->>U: 403 Forbidden / 401 Unauthorized
    end
```

## 5. Why this design

- **Single source of truth for identity**: only `auth-service` can create users,
  assign roles, or issue tokens. Every other service is "dumb" with respect to identity.
- **RS256 (asymmetric) over HS256**: the private key never leaves `auth-service`.
  Downstream services get only the public key, so a compromised downstream service
  can *verify* tokens but can never *forge* one.
- **Refresh token rotation + reuse detection**: every refresh both invalidates the
  old refresh token and detects replay of a stolen one, limiting the blast radius
  of a leaked token.
- **Stateless access tokens**: downstream services don't need a DB round trip or a
  network call to auth-service per request — they just verify a signature and read
  claims, which scales horizontally with zero added latency.
