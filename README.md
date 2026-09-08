# Daedalus

**Unit Matrix platform for construction: contractors track project progression by unit, and subcontractors record their own progress against it.**

The product is deliberately generic at this stage: the *unit* — what gets
tracked — and the *progress* recorded against it are the two core concepts, and
further features attach to them as they are defined.

Technically it is a two-app monorepo: an Express 5 API and a Vite + React
client, connected by a working vertical slice.

| App                  | Path            | Stack                                                             | Dev URL                 |
| -------------------- | --------------- | ----------------------------------------------------------------- | ----------------------- |
| `@daedalus/backend`  | `apps/backend`  | Express 5, TypeScript, Prisma/PostgreSQL, pino, zod, OpenAPI       | <http://localhost:3000> |
| `@daedalus/frontend` | `apps/frontend` | Vite, React 19, TypeScript, TanStack Query/Router/Table, Tailwind  | <http://localhost:5173> |

Both were adapted from
[`weehong/boilerplates`](https://github.com/weehong/boilerplates). The design
decisions behind this scaffold — and the trade-offs accepted — are recorded in
[SPEC.md](./SPEC.md).

## Prerequisites

Node >= 22, pnpm, and Docker (for PostgreSQL).

## Getting started

```sh
pnpm install          # once, at the root — single workspace lockfile
pnpm db:up            # PostgreSQL 16 in Docker on :5432
pnpm db:migrate       # apply migrations
pnpm db:seed          # 8 example matches
pnpm dev              # both servers, in parallel
```

Then open <http://localhost:5173/example> — the table, chart and form are
backed by the real API.

## Scripts

Run from the repository root; each fans out across both apps.

| Command          | Does                                                       |
| ---------------- | ---------------------------------------------------------- |
| `pnpm dev`       | Both dev servers in parallel (logs interleave)              |
| `pnpm build`     | Build both apps                                             |
| `pnpm lint`      | ESLint, zero warnings tolerated                             |
| `pnpm typecheck` | `tsc --noEmit` in both apps                                 |
| `pnpm test`      | Vitest only — no browser download needed                    |
| `pnpm test:e2e`  | Playwright (run `pnpm --filter <app> setup` first, and `pnpm db:up`) |
| `pnpm db:up`     | Start PostgreSQL                                            |
| `pnpm db:down`   | Stop it                                                     |
| `pnpm db:migrate`| `prisma migrate dev` on the backend                         |
| `pnpm db:seed`   | Reseed example matches (idempotent)                         |

Target one app with `pnpm --filter @daedalus/backend <script>`.

`pnpm test` deliberately runs the vitest-only scripts. Each app's own `test`
script also runs Playwright, which needs a ~400MB browser download that is not
installed by default — use `pnpm test:e2e` once you have run `setup`.

## How the apps talk to each other

In development the browser sees a **single origin**. Vite proxies `/api` to the
backend, so there is no CORS and no preflight:

```
browser ──▶ :5173/api/v1/matches
              └── vite proxy ──▶ :3000/api/v1/matches
```

`VITE_API_URL` is empty in development because of this. Set it to the real API
origin for production builds, where the two are served separately.

| Endpoint            | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `/health`, `/ready` | Liveness and readiness probes                     |
| `/api/v1/matches`   | `GET` list, `POST` create                         |
| `/docs`             | Swagger UI                                        |
| `/openapi.json`     | Generated OpenAPI 3.0 document                    |

## The example slice is disposable

`Match` exists only to prove the stack end to end. Delete it when your real
domain arrives:

**Frontend** — `src/features/example/`, `src/routes/example.ts`,
`src/store/useExampleStore.ts`, the `/example` link in `src/pages/Home.tsx`, and
the `example` translation keys in `src/assets/locales/*/translations.json`.

**Backend** — `src/routes/matches.route.ts`,
`src/controllers/matches.controller.ts`, `src/services/matches.service.ts`,
`src/schemas/matches.schema.ts`, the `Match` block in `src/openapi/registry.ts`,
the `matchesRouter` line in `src/routes/index.ts`, the `Match` model in
`prisma/schema.prisma`, `prisma/seed.ts`, and the `matches.*` tests.

## Notes

- **There is no git repository here.** This tree is unversioned by choice (see
  SPEC.md §2), but a root `.gitignore` is in place for whenever you `git init`.
- Schemas destined for OpenAPI must import `z` from `@/lib/zod.js`, not from
  `zod` directly. Under zod 4 `extendZodWithOpenApi` is not retroactive, so a
  schema built before it runs silently loses `.openapi()`.
- The two apps keep independent versions of vitest, TypeScript and
  `@types/node`. Both are on zod 4, which is what would make a shared contracts
  package possible later.

## Containers

The dev loop uses Docker for PostgreSQL only (`pnpm db:up`). To build or run the
API image, note that its **build context is the workspace root**, because the
pnpm lockfile lives there:

```sh
docker build -f apps/backend/Dockerfile -t daedalus-backend .   # from the root
docker compose -f apps/backend/docker-compose.yml up            # db + migrate + api
```

The runtime image is assembled with `pnpm deploy`, and Prisma's generated client
is copied out of the builder's virtual store — see the comments in the
Dockerfile before changing either step.

`pnpm test:e2e` on the frontend starts the API as well as Vite, since the
example page renders live data. PostgreSQL must already be up.
