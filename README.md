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
cp apps/frontend/.env.example apps/frontend/.env
cp apps/backend/.env.example apps/backend/.env
```

Fill in the Supabase values (Project Settings → API in the dashboard):

| File                  | Variable                 | Value                                             |
| --------------------- | ------------------------ | ------------------------------------------------- |
| `apps/frontend/.env`  | `VITE_SUPABASE_URL`      | The project URL                                   |
| `apps/frontend/.env`  | `VITE_SUPABASE_ANON_KEY` | The publishable anonymous key                     |
| `apps/backend/.env`   | `SUPABASE_URL`           | The same project URL                              |
| `apps/backend/.env`   | `DATABASE_URL`           | Session-pooler string **with `?schema=daedalus2`** |

The service-role key never enters this repository. `DATABASE_URL` is the
Supabase Postgres (see `docs/adr/0002-*.md`). For local Docker development,
explicitly set `DATABASE_URL` with `?schema=daedalus2` as well. The current
local defaults still select `public`; correcting them is tracked in
[ticket 10](.scratch/subcontractors/issues/10-align-local-database-schema.md).
Do not run migrations against those defaults.

```sh
pnpm db:up            # only for the local fallback: PostgreSQL 16 in Docker on :5432
pnpm db:migrate       # apply migrations to whichever database DATABASE_URL names
pnpm db:seed          # deterministic matches, Subcontractors and a sample Project
pnpm dev              # both servers, in parallel
```

Then open <http://localhost:5173>. You are sent to `/login`; sign in with an
Administrator account provisioned in the Supabase dashboard, and the Console
opens on `/projects`, a searchable list with development counts and a New project
action. Open a Project to manage its Structure and Unit Types. Subcontractors opens
the searchable, paged Directory, with creation and Member management.
`/example` (the table, chart and form backed by the real API) sits inside the
same guarded shell;
visit it directly, since it is absent from the navigation.

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
| `pnpm db:seed`   | Reseed deterministic matches, Directory and Project (idempotent) |

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
| `/api/v1/me`        | `GET` the signed-in identity (bearer token required) |
| `/api/v1/matches`   | `GET` list, `POST` create                         |
| `/docs`             | Swagger UI                                        |
| `/openapi.json`     | Generated OpenAPI 3.0 document                    |

## Sign in and the Console

Identity is Supabase's; the API only verifies it. The browser signs in with
`@supabase/supabase-js`, mirrors the Session into a Zustand read model, and
TanStack Router guards every route except `/login` in a pathless `_console`
layout. Each API call carries the Session's access token as a bearer header;
`requireAuth` on the backend verifies it against the project's JWKS with
`jose` and sets `request.user`. The reasoning is in
`docs/adr/0001-supabase-authentication.md`; the vocabulary (Administrator,
Session, Provisioning, Project) is in `CONTEXT.md`.

The Console reads the Administrator's email directly from the Session, with
no frontend `/api/v1/me` request. The backend endpoint and its tests remain as
the proof of bearer-token verification. A restored Session keeps the current
Console route after reload; an Administrator visiting `/login` is sent into
the Console.

| Route | Screen |
| ----- | ------ |
| `/` | Redirects to `/projects` |
| `/projects` | Searchable, paged Projects with Block, Storey and Unit counts |
| `/projects/new` | Create a Project with a unique name and code |
| `/projects/$id` | Structure panes, Project edit and confirmed deletion |
| `/projects/$id/unit-types` | Manage the Project's Unit Type catalogue |
| `/subcontractors` | Searchable, paged Directory with a New subcontractor action |
| `/subcontractors/new` | Create a Subcontractor with its first Member |
| `/subcontractors/$id` | Rename, manage Members, and confirm deletion |
| `/example` | Disposable reference demo, reached directly by URL |

At widths of 768px and up, the Console has a sticky 216px sidebar containing
the Daedalus wordmark, "Unit Matrix", Projects and Subcontractors navigation,
and a foot with the account email, Administrator role, language switcher and
Sign out. The current navigation entry is marked. On smaller screens a
sticky top bar opens the sidebar as a drawer. The menu toggle, Escape inside
the drawer, a backdrop click or a route change closes it; focus moves into
the drawer on open and returns to the toggle on close.

Sign out is an icon button beside the account email. It shows a spinner,
announces "Signing out…" and disables repeated presses while pending.
A failure leaves an inline alert for retry; success returns to `/login`.

The screens are built from the Industry design system ported into Tailwind's
theme layer (`apps/frontend/src/styles/tailwind.css`) and a set of framed
primitives under `apps/frontend/src/components/ui/`, each with a story and a
test. Shared layout primitives under `components/layout/` provide the shell,
sidebar, centred page container and header with optional actions. Locales are
`en-US` and `zh-CN`; the Chinese auth and Console strings are machine-translated
and flagged for review in the file. The sign-in screen says "Administrator
console" and "Enter console".

The Directory is global across Projects. Subcontractor names are unique after
case and whitespace normalization; Member phones are globally unique and
stored in E.164. Each Subcontractor keeps at least one Member. Deleting a
Subcontractor removes its Members after confirmation. The API guards every
Subcontractor route and scopes Member operations through the Subcontractor.
See the [finished spec](docs/specs/0002-subcontractor-directory.md) and
[62-story verification record](docs/specs/0002-subcontractor-directory-verification.md).

## Projects and Structure

Projects are sorted by name and searchable by name or code. Each Project has a
unique name and an uppercase code of 2–12 letters, digits or hyphens. Its
Structure tab has Blocks, Storeys of the selected Block, and Units of the
selected Storey. Selection stays in the URL, and the panes stack on a phone.

Every pane supports Add, Add many, rename and confirmed deletion. Add many
previews a numeric range (prefix, padding and suffix) or pasted names, marks
existing/repeated names, and creates the entire batch atomically in creation
order. A batch accepts up to 500 names; Units can target up to 200 Storeys of
one Block with at most 2,000 Units in total and an optional Unit Type. A server
clash refuses the entire batch and lists the names to correct.

The Unit Types tab lists codes, descriptions and usage counts. Codes are unique
within their Project ignoring case and whitespace; developer qualifiers remain
part of the code. Units can change or clear their type inline. Deleting a type
in use is refused with the count. Deleting a Project, Block or Storey names the
descendants that will also go, and cascades only after confirmation.

All Project routes require a verified Session and scope children through their
Project. Create and edit responses contain the full Project; deletes return
204 and trigger fresh queries. OpenAPI documents the contract at `/openapi.json`.
English and Chinese copy is available; Chinese is flagged for native review.
The idempotent seed includes one Project with 2 Blocks, 4 Storeys, 8 Units and
2 Unit Types. See the [approved spec](.scratch/projects/spec.md) and
[49-story evidence matrix](.scratch/projects/verification/ticket-09.md).

## The example slice is disposable

`Match` exists only to prove the stack end to end. Delete it when your real
domain arrives:

**Frontend** — `src/features/example/`, `src/routes/_console/example.ts`,
`src/store/useExampleStore.ts`, `e2e/example.spec.ts`, and the `example`
translation keys in `src/assets/locales/*/translations.json`. Regenerate the
route tree by starting Vite after removing the route. The demo has
no navigation entry to remove; the Console shell and its Projects and
Subcontractors routes stay.

**Backend** — `src/routes/matches.route.ts`,
`src/controllers/matches.controller.ts`, `src/services/matches.service.ts`,
`src/schemas/matches.schema.ts`, the `Match` block in `src/openapi/registry.ts`,
the `matchesRouter` line in `src/routes/index.ts`, the `Match` model in
`prisma/schema.prisma`, the Match-only section of `prisma/seed.ts`, and the `matches.*` tests. Keep the
Directory and Project seed data.

## Notes

- The backend's `dev` and `start` scripts load `.env` through Node's
  `--env-file-if-exists`. Prisma's CLI reads the same file on its own.
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
example page renders live data. The database named by `DATABASE_URL` must be
reachable. The suite intercepts Supabase's token, user and logout endpoints
at the browser's edge, so it needs no real account. The Console uses the
intercepted Session's email; the example still exercises the real matches API
and database. Playwright's browsers need
system libraries once per machine: `sudo pnpm --filter @daedalus/frontend exec playwright install-deps`.


## Upload a developer's Unit Matrix

For a Project with no Blocks, open **Structure → Upload Unit Matrix**. Choose
one `.xls` or `.xlsx` workbook up to 10 MB and select **Preview workbook**. The
preview opens the first sheet with detected Blocks; use the sheet picker to
choose another. Parsing creates no Project data.

Review each Block's Storey and Unit counts, Stack range, warnings and new Unit
Type codes. Rename or untick Blocks, then expand a Block to change or clear
cells, rename Storeys, and add or remove Storeys and Stacks. Edits survive sheet
switches; replacing a preview or leaving it asks for confirmation. Preview edits
are held in the page, so save them by committing before closing it.

Commit is available only after hard errors are corrected and at least one Block
is included. It atomically creates the selected Structure, reuses existing Unit
Types by their code key and returns to Structure with counts and the names of
Storeys omitted after editing. Empty Storeys produce no Units; a cell merged
across Stacks produces one Unit named by the first Stack. Qualifiers such as
`(p)`, `(M)` and `-PH` remain part of the Unit Type code. The upload action is
disabled once a Project has Blocks; importing revisions into an existing
Structure is outside this feature.

Both endpoints require a verified Session:

| Endpoint | Contract |
| --- | --- |
| `POST /api/v1/projects/:id/unit-matrix/parse` | One multipart `file`; returns all sheets and their detected Blocks without persistence. |
| `POST /api/v1/projects/:id/structure` | JSON `blocks → storeys → units`, with optional `unitTypeCode`; returns the full Project with status 201. |

The commit accepts 1–50 Blocks and at most 10,000 Units. Names are 1–60
characters and Unit Type codes are 1–40. Duplicate sibling names are refused.
A Project that already has Blocks receives `409 PROJECT_HAS_BLOCKS`, including
its current Block count. `/openapi.json` and `/docs` expose both request and
response schemas.

The backend reads workbooks with SheetJS 0.20.3 from its pinned CDN tarball;
see [ADR-0007](docs/adr/0007-sheetjs-from-its-own-cdn.md). Tests synthesize layout
fixtures; developer workbooks are not stored in the repository. The original
12-Block / 1193-Unit and 4-Block / 638-Unit schedules were checked directly,
excluding the restored sibling workbook. See the
[upload story and verification record](.scratch/projects/verification/ticket-14.md)
for automated coverage, database evidence and remaining verification limits.
