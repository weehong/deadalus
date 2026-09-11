# ADR-0002: A dedicated Postgres schema on the shared Supabase database

## Status

Accepted, 2026-09-08.

## Decision

Prisma points at the Supabase project's Postgres through the session-mode
pooler, and owns a dedicated schema named `daedalus2`, selected with
`?schema=daedalus2` on `DATABASE_URL`. Prisma's tables and its
`_prisma_migrations` history live entirely inside that schema.

The sibling `daedalus` repository manages its own tables in `public` through
Supabase migrations. Nothing in this repository reads or writes them.

## Alternatives considered

- **Sharing the `public` schema.** Rejected: Prisma would have to be baselined
  against tables it does not own, and `prisma migrate reset` would become a
  standing threat to the other application's data.
- **Keeping data on local Docker Postgres and using Supabase for identity
  only.** Rejected by the product owner in favour of one hosted database. The
  local Docker path is kept as a development fallback, not as the target.
- **A second Supabase project.** Rejected: it doubles provisioning for a
  database that is empty today.

## Consequences

- The session-mode pooler on port 5432 supports Prisma's migrations without a
  separate direct URL. If the transaction-mode pooler (port 6543) is adopted
  later, a `directUrl` must be added for migrations.
- The database password is not stored in this repository; it is supplied in
  `apps/backend/.env` by whoever runs the migrations.
- `prisma migrate dev` must only ever be run with `?schema=daedalus2` in the
  URL. A URL without the schema parameter would target `public`.
