# Daedalus — Scaffold Specification

Status: agreed 2026-09-08. Derived from a requirements interview; every decision
below was chosen explicitly, not defaulted.

## 0. Product

**Daedalus** is a unit Matrix platform for construction: contractors track project progression by unit, and subcontractors record their own progress against it.

Two concepts anchor it and everything else is expected to attach to them:

| Concept  | Meaning                                                           |
| -------- | ----------------------------------------------------------------- |
| Unit     | The thing whose progression is tracked (the axis of the matrix)   |
| Progress | A record of how far a unit has advanced, entered by a subcontractor |

The domain is intentionally left generic. The `Match` slice in §7 is scaffold
proof only and is unrelated to the product; it is replaced when the first real
unit/progress model is designed.

## 1. Scaffold purpose

Stand up a two-app monorepo from two existing boilerplates in
`github.com/weehong/boilerplates`, connected by a working vertical slice so the
frontend/backend seam is proven rather than assumed.

| Role     | Source                            | Package name        |
| -------- | --------------------------------- | ------------------- |
| Backend  | `apps/express-api-boilerplate`    | `@daedalus/backend`  |
| Frontend | `apps/vite-react-boilerplate`     | `@daedalus/frontend` |

Both are subdirectories of a monorepo upstream, not standalone repositories, so
they are extracted by copy rather than cloned individually.

## 2. Layout

```
daedalus-2/
├── SPEC.md                 this document
├── README.md               monorepo guide (new)
├── package.json            private root, recursive scripts
├── pnpm-workspace.yaml     packages: apps/*  + merged allowBuilds
└── apps/
    ├── backend/
    └── frontend/
```

**No version control.** The tree is placed on disk with no `.git/` and no
initial commit. Upstream history is discarded.

> Consequence accepted: there is no rollback point for the lockfile
> re-resolution, the zod major bump, or the Prisma migration regeneration.
> Recovery is manual, by re-extracting from the public upstream repo.

## 3. Package management

Single pnpm workspace, one lockfile at the root.

- Backend's `package-lock.json` is deleted; its dependency tree is re-resolved
  by pnpm. This tree is *not* the one upstream tested.
- The frontend's app-level `pnpm-workspace.yaml` is removed and its
  `allowBuilds` entries (`@swc/core`, `esbuild`) merge into the root file.
- `prisma` and `@prisma/client` are added to root `allowBuilds`. pnpm 11 blocks
  postinstall scripts by default; without this, `prisma generate` is silently
  skipped and the client is never produced.

Dependency versions are otherwise left as each app had them. The two apps keep
independent resolutions of `vitest` (2 vs 4), `typescript` (5.7 vs 5.9) and
`@types/node` (22 vs 24). No catalog, no root overrides.

## 4. Tooling removed

Deleted from **both** apps:

- `.husky/` (and its `commit-msg`, `prepare-commit-msg` hooks)
- `commitlint.config.cjs`
- the `config.commitizen` block
- scripts: `prepare`, `commitlint`, `commitizen`
- deps: `@commitlint/cli`, `@commitlint/config-conventional`, `husky`,
  `commitizen`, `cz-conventional-changelog`

Both `setup` scripts are rewritten. The frontend's currently reads
`git init && npx husky init && npx playwright install && shx rm .husky/pre-commit`,
which is invalid under both the no-git and no-husky decisions.

**Retained:** per-app `eslint.config.js` and `prettier.config.js` (they encode
genuinely different rule sets — React/a11y/storybook vs node/unicorn), per-app
`SCAFFOLD.md`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `LICENSE`, Storybook,
Playwright, and both `Dockerfile`s.

## 5. Backend zod 4 upgrade

| Package                          | From      | To       |
| -------------------------------- | --------- | -------- |
| `zod`                            | `^3.24.1` | `^4.5`   |
| `@asteasolutions/zod-to-openapi` | `^7.3.0`  | `^9.1.0` |

Rationale: align the schema dialect with the frontend (already zod 4), as a
prerequisite for a shared contracts package later.

Compatibility verified empirically against zod 4.5.4 and zod-to-openapi 9.1.0
before adopting — every API the backend uses survives:

- `z.ZodIssueCode.custom` resolves to `"custom"` (used in `src/config/env.ts`)
- `.transform((cfg, ctx) => ctx.addIssue(...))` + `z.NEVER` produces the
  expected custom issue
- `error.flatten()` still returns `{ formErrors, fieldErrors }` (used in
  `src/middlewares/validate.ts` and `src/middlewares/error-handler.ts`)
- `z.string().url()`, `z.string().datetime()`, `z.coerce.number()` all work
- `OpenAPIRegistry`, `OpenApiGeneratorV3`, `extendZodWithOpenApi` are all still
  exported by v9.1.0

Residual risk is type-level only (`ZodTypeAny` is deprecated in favour of
`ZodType`). **Gate: `tsc --noEmit` must pass on the backend.**

## 6. The seam

Development is same-origin via Vite's dev proxy. CORS is never exercised in dev.

```
browser ──▶ :5173/api/v1/matches
              └── vite proxy ──▶ :3000/api/v1/matches
```

- `vite.config.ts` gains `server.proxy = { "/api": "http://localhost:3000" }`
- Frontend `VITE_API_URL` is empty in dev (same-origin); it holds a real origin
  only in production builds.
- Backend `CORS_ORIGIN` stays `*` — unused in the dev path.

Endpoints mount on the backend's existing but empty `v1Router`, which already
reserves `/api/v1` with the comment `// Mount feature routers here`.

## 7. Vertical slice: Match

The seed domain mirrors the frontend's existing example feature exactly, so its
table, chart and form keep working against real data.

### Data model

The placeholder `User` model is dropped and `Match` becomes the only model. The
upstream `20260626000000_init` migration is regenerated as a single clean init
creating `matches`. Safe: no data exists and no code referenced `User`.

```prisma
model Match {
  id        String   @id @default(cuid())
  homeTeam  String
  awayTeam  String
  homeScore Int
  awayScore Int
  playedOn  DateTime
  ...timestamps
  @@map("matches")
}
```

### API

| Method | Path              | Behaviour                                      |
| ------ | ----------------- | ---------------------------------------------- |
| `GET`  | `/api/v1/matches` | List matches, `{ data: [...] }` envelope       |
| `POST` | `/api/v1/matches` | Create; `400` with zod field errors on invalid |

Files added, following the existing `health.*` pattern:
`src/services/matches.service.ts`, `src/controllers/matches.controller.ts`,
`src/routes/matches.route.ts`, zod schemas, and OpenAPI registry entries so the
routes appear in `/docs` and `/openapi.json`.

Validation reuses the existing `validate` middleware and central `errorHandler`.

### Seed

`prisma/seed.ts` generates 8 deterministic matches, wired to the `prisma.seed`
key so `prisma db seed` and `migrate reset` both run it. Uses `tsx`, already a
backend devDependency. Faker is **not** added to the backend.

### Frontend changes

- `src/features/example/api.ts` — faker mock replaced with a real `fetch`
  against `VITE_API_URL`.
- New `useCreateMatch` mutation; `onSuccess` invalidates the `["matches"]` query.
- `ExamplePage.handleCreate` stops appending to local `useState` and calls the
  mutation. (Today it fabricates `homeScore: 0`, `awayScore: 0`, `playedOn: ""`
  and loses the row on refresh.)
- `src/environment.d.ts` — declare `VITE_API_URL` and `VITE_APP_ENVIRONMENT`.
  It currently declares only an unused `VITE_APP_TITLE`.
- The docstring in `ExamplePage.tsx` listing what to delete when discarding the
  example must remain accurate after these edits. The slice stays throwaway.

### Tests

Mirroring the existing health tests:

- `tests/unit/matches.service.test.ts`
- `tests/integration/matches.route.test.ts` — `GET` → 200 + array,
  `POST` → 201, `POST` invalid body → 400

No new frontend tests. No Playwright specs added.

## 8. Root scripts

```jsonc
{
  "dev":       "pnpm -r --parallel dev",   // interleaved logs, accepted
  "build":     "pnpm -r build",
  "lint":      "pnpm -r lint",
  "typecheck": "pnpm -r typecheck",
  "test":      "pnpm -r test:unit:run",    // vitest only
  "test:e2e":  "pnpm -r test:e2e",         // opt-in
  "db:up":     "docker compose -f apps/backend/docker-compose.yml up -d db",
  "db:down":   "docker compose -f apps/backend/docker-compose.yml down"
}
```

`test` deliberately targets the vitest-only scripts rather than each app's
`test` script, which is `vitest run && playwright test` and would fail without
a ~400MB browser download. Playwright browsers are **not** installed.

The frontend's vitest script is named `test:unit`, not `test:unit:run`; a
`test:unit:run` alias is added so the recursive root script hits both apps.

## 9. Containers

Docker is used for Postgres only. Both apps run on the host.

```
postgres  docker, :5432   (apps/backend/docker-compose.yml, `db` service)
api       host,   :3000   (tsx watch)
vite      host,   :5173   (hmr)
```

No new compose file is written. The backend's existing `migrate` and `api`
services remain available for testing the container build, but are unused in the
dev loop. All three ports confirmed free at time of writing.

## 10. Known inconsistencies carried forward

- The frontend's `.gitignore` does not ignore `.env`, and upstream committed one.
  `.env` will be added to it so the tree is correct if `git init` ever happens —
  but with no repository, nothing enforces this.
- Backend and frontend define the `Match` shape separately (Prisma + zod on one
  side, react-hook-form + zod on the other). No shared contracts package; the
  zod 4 alignment in §5 is what makes one possible later.

## 11. Acceptance

The scaffold is done when all of the following have been run and reported with
real output:

1. `pnpm install` completes at the root
2. `pnpm db:up` brings Postgres up healthy
3. `prisma generate`, `prisma migrate`, and the seed all succeed
4. Backend `tsc --noEmit` passes (the zod 4 gate)
5. `pnpm test` passes — health tests plus the new matches tests
6. API responds on `:3000` — `/health` and `/api/v1/matches` returning seeded rows
7. Vite serves `:5173`, and `/api/v1/matches` through the proxy returns the same rows

## 12. Post-acceptance corrections

Applied after the §11 run, once a cleanup sweep found breakage the dev loop had
hidden.

**Caused by this scaffold's own decisions:**

- `apps/backend/Dockerfile` referenced the deleted `package-lock.json` and used
  `npm ci`, so `docker build` failed outright. Rewritten for pnpm with the
  **workspace root as build context**, using `pnpm deploy --legacy --prod` for a
  flattened runtime tree; Prisma's generated client is copied from the builder's
  version-hashed virtual store path. Verified by building the image and serving
  `/health`, `GET` and `POST` against the live database (564MB, healthcheck
  passing). A root `.dockerignore` replaces the app-level one, since ignore
  rules must sit at the context root.
- `apps/backend/docker-compose.yml` `migrate`/`api` services rebuilt against the
  new context, and `npx prisma migrate deploy` became
  `pnpm --filter @daedalus/backend exec prisma migrate deploy`.
- `apps/backend/playwright.config.ts` ran `npm run build && npm run start`.
- `apps/frontend` e2e now depends on a live API: the example page renders the
  `h1` only on query success, so the existing spec would fail with the backend
  down. Its `webServer` now starts both servers; PostgreSQL must be up.

**Pre-existing, fixed while here:** the frontend ESLint config lacked an
`argsIgnorePattern` for the `_props` convention its own source uses; vitest
exited non-zero on the frontend's empty test set (`--passWithNoTests`);
`storybook:setup` invoked an uninstalled package (script removed).

**Removed as dead:** `shx` and `@faker-js/faker` from the frontend.

**Renamed:** `index.html` title and its e2e assertion, `Vite React Boilerplate`
→ `daedalus-2`.

**Docs:** npm → pnpm throughout both apps' docs; husky/commitlint references
removed; each `SCAFFOLD.md` carries a note that it records the original
standalone scaffold and lists how the app has since diverged.

**Added:** a root `.gitignore`, despite §2's no-git decision, so the tree is
correct the moment `git init` is run.
