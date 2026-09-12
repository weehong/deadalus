# ADR-0009: Member Sessions are issued by the API, on phone number alone, for the proof of concept

## Status

Accepted, 2026-09-12. A deliberate, temporary exception to ADR-0001.

## Decision

A Member signs in to the Field by entering their phone number and nothing
else. The API looks the number up in the Member table and, if it exists,
signs a Member token with its own secret from the backend environment, valid
for thirty days. A separate `requireMember` check verifies that token, loads
the Member on every request, and derives the Subcontractor from it, never
from anything the client sends (ADR-0003). Supabase remains
Administrator-only, so a verified Supabase token still proves an
Administrator and no role claim is minted; `requireAuth` is unchanged.

This is knowingly insecure: anyone who knows a Member's phone number can act
as that Member. It is accepted only because the product is a proof of concept
and the alternative blocks the Field on an SMS provider.

## Alternatives considered

- **Supabase phone sign-in with a one-time code by SMS.** The intended end
  state. Deferred: it needs a paid SMS provider configured in the dashboard
  before a single Member can sign in.
- **Supabase phone sign-in with a shared fixed password.** Rejected: it
  needs every Member created by hand in the Supabase dashboard as well as in
  the Directory, and a role claim on every Administrator to tell the two
  apart, for no more security than the chosen option.
- **A Member row per Supabase user with anonymous sign-in.** Rejected: the
  phone would still travel from the client on every request, which is the
  client-supplied identity ADR-0003 forbids.

## Consequences

- ADR-0001's rejection of "Express minting its own token" stands for
  Administrators; this ADR is the one sanctioned exception, and the two
  token kinds never verify each other.
- The backend gains one secret, `MEMBER_TOKEN_SECRET`, alongside the
  existing `SUPABASE_URL`.
- When real Member authentication arrives, this ADR is superseded: Members
  move onto Supabase phone sign-in, the role claim retired here is added at
  Provisioning, and `requireMember` verifies a Supabase token instead. The
  Field, its routes and the Progress entry rules do not change.
- Removing a Member invalidates their Session on the next request, because
  the Member is loaded on every request rather than trusted from the token.
