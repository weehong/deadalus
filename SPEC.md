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

> **Superseded in part by §13.** `DATABASE_URL` now names the Supabase
> Postgres; the Docker Postgres below remains a local fallback only.

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

## 13. Sign-in and the Supabase database

Added 2026-09-08, after the scaffold. The sign-in screen from the
`unit-matrix-vite` design prototype was built fresh in `apps/frontend` as a
full vertical slice.

- **Identity is Supabase's.** Email and password through `@supabase/supabase-js`
  in the browser, reusing the sibling `daedalus` repository's project. No user
  or session table in Prisma. `docs/adr/0001-supabase-authentication.md`.
- **The API verifies, never trusts.** `requireAuth` checks the bearer token
  against the project's JWKS with `jose` (ES256, issuer and audience pinned);
  `GET /api/v1/me` is the round-trip proof. `SUPABASE_URL` is required in the
  backend env, and the `dev`/`start` scripts now load `.env`, which the
  scaffold never needed.
- **One hosted database, one schema of our own.** `DATABASE_URL` is the
  Supabase session pooler with `?schema=daedalus2`, so Prisma's tables and
  migration history never touch the `public` schema the sibling manages.
  `docs/adr/0002-dedicated-schema-on-the-shared-supabase-database.md`.
- **Routing.** `/login` is public; a pathless `_console` layout guards `/` and
  `/example`. The boilerplate `Home` is replaced by a placeholder console that
  shows the identity from `/api/v1/me` and offers log out.
- **Design system.** The prototype's colour and type tokens are Tailwind theme
  tokens; spacing uses Tailwind's scale. Primitives (`BlueprintFrame`, `Button`,
  `Input`, `Field`, `Alert`, `Logo`, `LabelRow`, `LanguageSwitcher`,
  `BootLoadingState`, `SplitLayout`) each have a story, a test and a barrel.
- **Locales.** `en` and `es` became `en-US` and `zh-CN`, with detection
  normalised and Traditional Chinese falling back to English. Chinese exists
  for the auth, console and configuration strings only, machine-translated.
- **Tests.** Frontend unit tests use the real translations and jest-dom
  matchers registered on the frontend's own `expect` (pnpm resolves the
  `jest-dom/vitest` entry against the backend's vitest 2, so the setup file
  extends explicitly). Backend integration tests mint ES256 tokens with a
  generated key and stub the JWKS fetch. Playwright intercepts the provider's
  token endpoint and `/api/v1/me`.
- **Vocabulary.** `CONTEXT.md` seeds the glossary; **Project** is the top-level
  term here, where the sibling says **Site**.

## 14. The Console shell and content layout

Agreed 2026-09-09 after a requirements interview; every decision below was
chosen explicitly. Its placeholder screens were superseded by §§15–16.
Built after §13, from the `unit-matrix-vite` prototype's
`StaffShell`. Vocabulary: **Console** and **Sign out** join `CONTEXT.md`.

### Reference

The prototype disagrees with itself: `DESIGN_SPEC.md` describes a sticky top
bar, while the built code and README use a fixed 216px left sidebar. The
**built code is the reference**. The sidebar carries the brand, the navigation
entries and an account block pinned to the foot.

### Shell

- From Tailwind's `md` breakpoint (768px) up: a 216px sidebar, sticky for the
  full viewport height, with the content column beside it. The breakpoint
  matches the prototype's own three-pane collapse at ~760px, so the Project
  screen and the shell change shape together.
- Below `md`: a slim top bar with the wordmark and a menu toggle. The same
  sidebar opens as an overlay drawer that closes on Escape, on the backdrop,
  on the toggle, and whenever the route changes. The toggle carries
  `aria-expanded` and `aria-controls`; focus moves into the drawer on open and
  back to the toggle on close.
- The shell owns the page's single `main` landmark. The example page's own
  `main` becomes a `div`.

### Sidebar contents

| Region | Content |
| ------ | ------- |
| Brand  | The Daedalus logo over the sub-label "Unit Matrix" |
| Nav    | **Projects**, **Subcontractors** — both route to placeholder pages |
| Foot   | Account block, language switcher, **Sign out** |

- The **account block** shows initials in a hairline square, the email, and
  the role label "Administrator". It reads the Session's user synchronously;
  `GET /api/v1/me` returns only id and email, so the prototype's name and
  "Site staff" chip cannot be reproduced yet. Initials are the first letters
  of the first two words of the email's local part, or its first two letters
  when there is one word.
- The active entry is marked by the router's `aria-current="page"` and styled
  with the prototype's left accent rule and tinted background.
- The prototype's **"Subcontractor view"** button is dropped: the
  Subcontractor flow is not built and the button would lead to a stub.
- Sign-out failure shows inline alert text under the button, as the
  placeholder page did.

### Routes

| Route              | Screen |
| ------------------ | ------ |
| `/`                | Redirects to `/projects` |
| `/projects`        | Header row (kicker "Portfolio", heading "Projects") + a framed "not built yet" notice |
| `/subcontractors`  | Header row (kicker "Directory", heading "Subcontractors") + the same notice |
| `/example`         | Unchanged, inside the shell, absent from the nav |

The placeholders deliberately say "not built yet" rather than showing a
domain empty state with disabled search and actions: an empty state would
promise data models that do not exist.

### Content layout

Two primitives, each with a story, a test and a barrel:

- **Page** — the content column: centred, `max-width: 1400px`, the prototype's
  padding.
- **PageHeader** — kicker over the `h1`, an actions slot opposite, wrapping
  under the heading when narrow.

**Breadcrumb** is deferred until the Project screen, its first consumer.

### Seam

Presentational parts live in `components/layout` and take plain props, so
stories and tests need neither a router nor a Session:

```
components/layout/
  Page/            PageHeader/       ConsoleShell/
  Sidebar/         Sidebar/NavItem/  Sidebar/AccountBlock/
components/ui/Placeholder/
```

`NavItem` is a plain anchor whose active style keys off `aria-current`.
`features/console/` wires them: `NavLink` is `createLink(NavItem)`,
`navigation.ts` lists the entries, and `ConsoleLayout` gives the shell the
router's pathname, the Session's email, the translations and the sign-out
action. The `_console` layout route renders `ConsoleLayout`.

### Removed

- `pages/Console.tsx` (the identity placeholder) and its `console.*` strings.
- `features/auth/api.ts` (`useMeQuery`) and the Playwright `/api/v1/me`
  intercept, which lost their only consumer. The backend `/me` route, its
  tests and its OpenAPI entry stay as the round-trip proof.

### Copy

- "Log out" becomes **"Sign out"** everywhere, pairing with "Sign in".
- The sign-in screen says **"Administrator console"** and **"Enter console"**
  in place of "portal".
- New zh-CN strings are machine-translated and flagged in the file.

### Not an ADR

Nothing here is hard to reverse: the sidebar can become a top bar by
replacing one component, and the seam is a refactor. No ADR is recorded.


## 15. The Subcontractor Directory and its Members

Built 2026-09-10. This section supersedes section 14's Subcontractors
placeholder; section 16 also supersedes the Projects notice. The approved design is
recorded in [spec 0002](docs/specs/0002-subcontractor-directory.md), with
[verification for all 62 stories](docs/specs/0002-subcontractor-directory-verification.md).

The Console now has a global Directory at `/subcontractors`, with alphabetical
paging, Member counts and stored phones. Search waits 300 ms before querying
Subcontractor names, Member names and phone digits, and resets to page 1.
`/subcontractors/new` creates a Subcontractor and its first Member atomically.
`/subcontractors/$id` shows Members and supports inline rename, add and edit,
Member removal, and confirmed Subcontractor deletion. All screens have English
and Chinese copy; Chinese remains flagged for native review.

The API mounts all eight operations behind verified Session tokens. Member
reads and writes always include their Subcontractor id. Name identity is
trimmed, whitespace-collapsed and lowercased with a unique derived key; phones
are normalized on the server to E.164, defaulting only there to +65, and are
unique across all Members. Stable 409 codes identify taken names, taken phones
and refusal to remove the last Member. Creation uses a nested database write;
removal uses a serializable transaction with up to three attempts on a
serialization conflict. Subcontractor deletion cascades to Members.

Implementation refinements preserve the approved behavior: SQL LIKE wildcards
are escaped for literal substring search, the name key is derived by the
service on every create and rename and created with its unique index in the
same migration as the tables, and the fetch helper has a separate operation
for empty 204 responses. The Dialog
primitive uses HeadlessUI for its accessible name, focus containment, Escape
handling and trigger focus restoration. Query invalidation refreshes the
Directory and affected detail after mutations. No Assignment check is built.

Migrations and verification target the dedicated `daedalus2` schema. Local
fallback URLs that still select `public` are an existing inconsistency recorded
in [ticket 10](.scratch/subcontractors/issues/10-align-local-database-schema.md);
set `DATABASE_URL` explicitly with `schema=daedalus2` before local migration or
seed commands. The isolated local database was verified; the hosted Supabase
database was not contacted.

The handoff's Playwright dependency limitation was stale: Chromium, Firefox and
WebKit run on this host without installing system packages. Final combined
results and the distinction between HTTP mocks, browser fakes and real database
checks are recorded in the verification document.


## 16. Projects and their Structure

Built 2026-09-11 from the [approved Projects spec](.scratch/projects/spec.md).
This section supersedes section 14's Projects placeholder. The unused
Placeholder component and both `console.notBuilt` locale keys are removed.
The [story matrix](.scratch/projects/verification/ticket-09.md) records evidence
for stories 1–49; upload has its own verification record.

The Console opens on a searchable, paged Projects list ordered by normalized
name with code and descendant counts. Creation requires a unique trimmed name
and a unique uppercase code of 2–12 letters, digits or hyphens. The detail screen
has the Project name/code, back navigation, edit/delete actions, and Structure
and Unit Types tabs. The selected Block and Storey are URL state. On phones the
three labelled panes stack vertically with the selected parents in headings.

Each pane creates one row or an atomic batch from a numeric range or pasted
list. The preview lists all generated names and marks sibling clashes and
repetitions before submission. Server validation accepts 1–500 names; Unit
batches target 1–200 Storeys of one Block with a 2,000 Unit product limit.
All names are trimmed free text of 1–60 characters. Sibling identity collapses
whitespace and ignores case. Positions append in supplied order inside a
serializable transaction with bounded retries, and reads order by position
then id. Stable 409 codes list every clashing name without partial creation.
Rename never reparents a row; Unit editing may also set or clear its Unit Type.

Unit Types are the per-Project catalogue in ADR-0005. Code identity ignores
case and all whitespace; qualifier text is preserved per ADR-0006. The optional
description can be cleared. The catalogue is ordered by code key and shows
derived Unit counts. A foreign Project's child or Unit Type is a 404. A type
in use cannot be deleted, including a concurrent use detected by the database.
Confirmed Project/Block/Storey deletion cascades. Project deletion removes
Blocks before the Project in one transaction so typed Units do not trigger
the Unit Type Restrict foreign key during PostgreSQL cascade ordering.

All 17 manual-Structure API operations mount behind verified bearer-token
authentication and appear with request/response schemas in `/openapi.json`.
Creates and edits return the full Project; successful deletes return 204, as
the more specific API contract requires despite story 45's broad wording.
The client caches full responses and invalidates list counts; deletes refetch.
Forms, errors and dialogs are translated into both locales, with Chinese
flagged for native review. Native table/list/form semantics and shared Dialog
focus handling are checked at component and browser seams.

The additive migration and idempotent seed were exercised against the configured
`daedalus2` database. Constraint, cascade, concurrency and capacity observations
are recorded separately from mocked HTTP and browser-edge fake evidence in the
story matrix and prerequisite record. Existing dependency advisories remain
follow-up work; this feature introduced no new advisory pair. Final combined
verification is recorded after all implementation tickets are integrated.

## 17. Developer Unit Matrix upload

Built 2026-09-11, following Projects section 16. The approved design remains in
[the Projects spec](.scratch/projects/spec.md), with
[stories 50–62 and verification](.scratch/projects/verification/ticket-14.md).
The upload route `/projects/$id/upload` sits under the Project layout and is
reached from Structure when the Project has no Blocks.

The guarded multipart parse route accepts one `.xls` or `.xlsx` file up to
10 MB and returns every sheet as plain JSON without persistence. SheetJS is a
server-only dependency pinned to the CDN URL in ADR-0007; Multer uses bounded
memory storage. Cached formula values, horizontal merged Units, shared Storey
columns, multiple bands and bottom-aligned Blocks are handled. Empty and repeated
Storeys are dropped with labelled warnings; count and schematic rows are ignored.
Workbook dimensions, merge processing and delayed-label searches have work bounds.

Ticket 13 refines the older spec's no-stack-row rejection: a convincing grid
under a merged header can infer Stacks from 1 and emits `INFERRED_STACKS` for
review. Irregular Stack numbering and empty Blocks are retained with warnings.
The other stable codes are `EMPTY_STOREY`, `DUPLICATE_STOREY`,
`NON_CONSECUTIVE_STACKS` and `EMPTY_BLOCK`. Warning labels preserve the original
Storey text, while the client translates codes rather than server prose. The
[specific clarification and original workbook totals](.scratch/projects/issues/13-read-the-awkward-layouts-with-warnings.md)
record why this differs from the older generic detection rule.

The preview chooses the first sheet containing Blocks. It shows one expanded
Block at a time, counts, Stack ranges, warnings and new Unit Type codes. The
Administrator can rename or exclude Blocks, edit or clear cells, rename Storeys,
and insert or remove Storeys and Stacks. Edits survive sheet switches and failed
replacement parses. Confirmation protects replacement and unsaved navigation;
these drafts remain page state and are not durable saved drafts.

The client translates non-empty cells into Units named by their padded Stack,
leaves merged followers absent, and omits Storeys cleared by editing. It lists
hard errors at their row or cell and disables Commit until they are resolved.
The authenticated JSON commit route independently validates 1–50 Blocks, names
of 1–60 characters, codes of 1–40 characters, the 10,000-Unit cap and duplicate
sibling name keys. It uses an 8 MB request bound after authentication; other
JSON routes retain their existing default bound.

A Serializable transaction rechecks that the Project is empty, reuses Unit Types
by uppercase whitespace-free code key, creates missing Types with their first
spelling, and creates all rows in array order using bounded batches. Qualifiers
remain in the code as required by ADR-0006. A competing commit receives
`409 PROJECT_HAS_BLOCKS` after the winner is visible; concurrent Type creation
is retried and reused. Success returns the full Project, refreshes queries and
navigates to Structure. Import counts and edited-out Storey labels are snapshots
preserved even after later manual Structure changes.

Both parse and commit are registered with generated OpenAPI schemas. English
and Chinese upload keys have matching interpolation fields, with Chinese flagged
for native review. All parser fixtures are synthesized; the original developer
files were read directly without repository copies. Source workbook totals,
actual database atomicity/concurrency checks, and combined browser verification
are recorded separately from mocked HTTP and browser evidence in the verification
record. Uploading revisions into a populated Structure remains outside scope.
