# ADR-0001: Supabase authentication, verified by the API against its signing keys

## Status

Accepted, 2026-09-08.

## Decision

Administrators sign in with email and password through Supabase, using the
same Supabase project as the sibling `daedalus` repository. The browser holds
the Session; the provider client is created in exactly one module
(`apps/frontend/src/auth/supabase.ts`) and only the authentication boundary
(`apps/frontend/src/auth/auth.ts`) may import it. The provider's auth-state
stream is mirrored into a Zustand read model, so route guards read a
synchronous value through router context and the application holds an explicit
"restoring" state until the first auth-state event arrives after boot.

The Express API trusts nothing from the browser. Protected routes carry
`requireAuth`, which verifies the Supabase access token locally with `jose`
against the project's published JWKS (`/auth/v1/.well-known/jwks.json`),
checking the issuer and the `authenticated` audience. `GET /api/v1/me` returns
the identity the token carries and is the proof of the round trip. No user or
session table exists in Prisma; identity is Supabase's, and the API only
consumes it.

Provider errors are collapsed into a closed set — `InvalidCredentials`,
`RateLimited`, `Unavailable`, `Unknown` — by a pure mapping. Every 400-class
rejection, including an unconfirmed email, becomes the same generic message so
the sign-in screen cannot be used to discover which addresses have accounts.

## Alternatives considered

- **A custom user table with scrypt or argon2 hashing and a cookie session in
  Express.** Rejected: it adds security-sensitive infrastructure the product
  does not require, and the sibling repository already committed to Supabase.
- **Express brokering the sign-in and minting its own cookie.** Rejected: it
  re-introduces the session store the previous option needs, and puts a second
  identity system in front of the first.
- **Verifying tokens with the shared HS256 secret.** Rejected: the project
  publishes an asymmetric ES256 key, and a shared secret would have to live in
  every backend environment. JWKS keeps the API secret-free and survives key
  rotation.
- **Calling Supabase's `getUser` on every request.** Rejected: one network hop
  per protected request for no gain over local verification.

## Consequences

- The frontend needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; the
  backend needs `SUPABASE_URL`. The service-role key never enters this
  repository.
- The backend's `dev` and `start` scripts load `.env` via Node's
  `--env-file-if-exists`, which the scaffold never needed while every variable
  had a default.
- End-to-end tests intercept two seams at the browser's edge — the provider's
  token endpoint and `/api/v1/me` — so they run without network or a real
  account. The JWKS path is covered by backend integration tests with a
  generated key pair.
- Accounts are provisioned in the Supabase dashboard. There is no sign-up.
