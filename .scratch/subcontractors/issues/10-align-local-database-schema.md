# 10: Align local database configuration with the dedicated schema

**What to fix:** Local database defaults still select `public`, contradicting
ADR-0002's dedicated `daedalus2` schema. This predates the Directory feature.
`apps/backend/src/config/env.ts` uses `schema=public` in its fallback;
`apps/backend/.env.example` repeats that local URL; the migrate and API services
in `apps/backend/docker-compose.yml` also select `public`.

**Blocked by:** None

**Status:** ready-for-agent

The Directory implementation and its isolated migration checks explicitly used
`schema=daedalus2`. README now tells developers to supply that parameter rather
than use the inconsistent fallback. No configuration or existing database was
changed as part of ticket 09.

- [ ] Align the local fallback, example and Compose URLs with `schema=daedalus2`, preserving explicit externally supplied URLs.
- [ ] Review relevant configuration tests and local setup documentation for the same schema assumption.
- [ ] Verify a fresh isolated local migration and seed creates application tables and migration history in `daedalus2`, leaving `public` untouched.
- [ ] Document the handling of preexisting local `public` data; do not move or delete it automatically.

## Comments

2026-09-10: Follow-up recorded during ticket 09. This is a preexisting
configuration inconsistency, outside the approved Directory implementation.
ADR-0002 and [verification record](../../../docs/specs/0002-subcontractor-directory-verification.md)
explain the required schema isolation. Hosted credentials and databases are
outside this follow-up's default verification scope.
