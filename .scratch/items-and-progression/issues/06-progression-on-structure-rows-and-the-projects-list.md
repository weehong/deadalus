# 06: Progression on Structure rows and the Projects list

**What to build:** Every Block, Storey and Unit row on the Structure tab, and every Project in the list, shows a Progression badge: a whole-number percentage that is the plain average of every Item beneath it, unassigned Items at 0. Where there are no Items the badge is blank with an accessible "No Items" label, never 0. Entering progress on the Unit card moves the badges up the tree without a reload. Delete confirmations for Unit, Storey, Block and Project name the Items and Progress entries that go with them. The dev seed gives a fresh database Catalogue Items, Items, two Assignments and a few entries so the badges have something to show.

Underneath: the full Project read's `progression` and `entryCount` at every level become live from the stored Item Progression (the query module from ticket 01); `GET /projects` rows gain `itemCount` and `progression`. The seed uses fixed ids and stays idempotent.

Spec: `.scratch/items-and-progression/spec.md`. ADR-0008 applies.

**Blocked by:** 05 (Enter progress from the Unit card)

**Status:** complete

- [x] The full Project read's `progression` and `entryCount` at Unit, Storey, Block and Project reflect the mocked Items, with `null` where none; the Projects list carries `itemCount` and `progression`; covered at the HTTP seam
- [x] The Progression badge is a presentational component with a story and a test, including the `null` state
- [x] Badges appear on every Structure row and in the Projects list, matching the server's numbers; the stacked phone layout keeps them visible
- [x] A new entry on the Unit card updates the Unit, Storey, Block and Project badges without a reload
- [x] Delete confirmations for Unit, Storey, Block and Project name Item and entry counts
- [x] The dev seed adds Catalogue Items, Items, Assignments and entries idempotently
- [x] Every string in both locales; the e2e fake carries the new fields and the e2e spec covers the badges, the blank state and a confirmation's counts

## Comments

### 2026-09-12 — implementation evidence (ticket agent)

Backend
- `src/services/progress.service.ts`: `readProjectRollups(projectIds)` reads every listed Project's Item rows in one query (scoped by `projectId in`) and folds them with the existing `rollUp`, so the Projects list shares the roll-up module rather than a second copy; a listed Project with no Items rolls up to `null` and an empty page reads nothing.
- `src/services/projects.service.ts`: `ProjectRow` and `listProjects` gain `itemCount` and `progression`. `src/openapi/registry.ts`: `ProjectRow` schema gains both fields (`progression` nullable 0 to 100).
- `tests/integration/projects.route.test.ts` (boundary fake for `item.findMany` honouring the Project scope; a page with 100/50/0 → 50 and a Project with no Items → `null`; an empty page reads no Items; OpenAPI row schema) and `projects-search.route.test.ts` (rows carry the new fields); `project-detail.route.test.ts` gains a per-level case (Unit, Storey, Block and Project `itemCount`/`entryCount`/`progression` from mocked Item rows, `null` at every level of an Item-less Block).
- `pnpm --filter @daedalus/backend exec vitest run tests/integration/projects.route.test.ts tests/integration/projects-search.route.test.ts tests/integration/project-detail.route.test.ts tests/integration/projects-contract.route.test.ts tests/unit/progress.service.test.ts` — 63 passed. Whole backend suite `vitest run` — 42 files, 531 passed. `typecheck` and `lint --max-warnings 0` — clean.
- Seed `prisma/seed.ts` (inside the existing Project transaction): 3 Catalogue Items (Kitchen cabinet, Wardrobe, Sink), 18 Items across the 8 seeded Units (Sink in Block A Storey 01 only), Block A's Kitchen cabinets assigned to Acme Fitout and its Wardrobes to Beacon Joinery (8 Items, `assignedAt` fixed), 5 Progress entries (Administrator and Member authors with Subcontractor name snapshots). Fixed ids throughout; Catalogue Items and Items upsert, entries are `deleteMany` for the seeded Items then `createMany`, and each Item's stored `progression` is computed from its latest seeded entry (createdAt then id), so they cannot drift. No live database here: verified by typecheck and lint only.

Frontend
- `ProgressionBadge.tsx` (story with Default/NothingDone/Complete/NoItems, test with rounding 45.4→45%, 45.5→46%, 0%, 100% and the `null` state: no percentage, `sr-only` "No Items"). `StructurePane` rows take a `badge` rendered inside the row button, so a row's accessible name ends with its Progression ("A 2 storeys · 2 units 53%", "B 1 storeys · 1 units No Items"); `UnitCard` takes a `badge` beside the name; `BlocksPane`, `StoreysPane` and `UnitsPane` pass `ProgressionBadge` from the read's `progression`. `ProjectsTable` gains a Progression column (`api.ts` `ProjectRow` carries `itemCount`/`progression`).
- Delete confirmations: Unit, Storey and Block dialogs name `itemCount` and `entryCount` from the read; `DeleteProjectDialog` takes `itemCount`/`entryCount` (wired in `ProjectLayout`) and its copy now also names Catalogue Items among what goes. Strings updated in en-US and zh-CN (zh-CN machine-translated); new keys `projects.columns.progression` and `projects.progression.none`.
- `useProgressEntryMutations.ts`: verified the entry mutation already invalidates the Project query (exact), which refetches the roll-ups for the Unit, Storey and Block rows; added invalidation of the Projects list so the Project's column is fresh without a reload.
- `pnpm --filter @daedalus/frontend exec vitest run src/features/projects` — 33 files, 115 passed (whole `src/`: 67 files, 235 passed). `typecheck` and `lint --max-warnings 0` — clean.
- e2e: `e2e/projects-api.ts` list rows carry `itemCount`/`progression` from `fullProject`; `e2e/units-api.ts` and `e2e/structure-api.ts` now answer with `fullProject` (roll-ups included) as ticket 02 suggested. New `e2e/project-progression.spec.ts` — 4 passed: badges on every Block, Storey and Unit row and in the list matching the fake's numbers (53%, 30%, 100%) with the blank "No Items" state on an Item-less Block, Storey, Unit and Project (never "0%"); an entry of 100 on the Unit card moving the Unit and Storey to 50%, Block A to 67% and the Project's list row to 67% with a `window` marker proving no reload; the Unit, Storey, Block and Project confirmations naming 2/2, 2/2, 3/3 and 3/3 Items/entries; Chinese at 390px with badges, "暂无物品", the Unit confirmation and no horizontal scroll.
- Specs updated for the new copy and row names: `projects.spec.ts` (Progression column; row text ends in "No Items"), `project-edit-delete.spec.ts`, `project-blocks.spec.ts`, `project-storeys.spec.ts`, `project-units.spec.ts`, `project-accessibility.spec.ts`, `unit-matrix-editor.spec.ts` (exact row names gain " No Items").
- `pnpm --filter @daedalus/frontend exec playwright test e2e/projects.spec.ts e2e/project-detail.spec.ts e2e/project-progress.spec.ts e2e/project-edit-delete.spec.ts e2e/project-blocks.spec.ts e2e/project-storeys.spec.ts e2e/project-units.spec.ts e2e/project-accessibility.spec.ts e2e/project-progression.spec.ts e2e/structure-commit.spec.ts e2e/unit-matrix-upload.spec.ts e2e/unit-matrix-editor.spec.ts e2e/project-items.spec.ts e2e/project-apply-items.spec.ts e2e/project-assign-items.spec.ts e2e/project-remove-items.spec.ts e2e/project-unit-types.spec.ts e2e/project-create.spec.ts --project=chromium` — 69 passed.

Notes for the parent
- Shared files touched with string edits only: `apps/backend/src/openapi/registry.ts`, `apps/backend/prisma/seed.ts`, both `translations.json`, `apps/frontend/e2e/projects-api.ts`. No migration, env var or generated file; `routeTree.gen.ts` unchanged (no new route).
- The API returns the unrounded average (as the full read already did); the badge rounds for display only, per the spec.
- Prettier: every file this ticket created is formatted. Pre-existing files still non-conforming were already so at HEAD and were left as they were (both `translations.json`, `e2e/project-blocks.spec.ts`, `e2e/unit-matrix-editor.spec.ts`); `e2e/projects-api.ts`, non-conforming at HEAD, was formatted by this ticket's Prettier pass, so its diff carries formatting lines beside the two new row fields.
