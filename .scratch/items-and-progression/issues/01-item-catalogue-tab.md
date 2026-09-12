# 01: The Item Catalogue and its tab

**What to build:** An Administrator opens a Project and finds a third tab, Items, at `/projects/$id/items`, listing the Project's Catalogue Items with how many Units hold each. They add a Catalogue Item with a required name (unique within the Project however it is spaced or cased), rename one inline, and delete one; deleting is refused inline with the count while any Item exists and confirms otherwise. Underneath, the three new tables (Catalogue Items, Items, Progress entries) arrive with their migration, and the full Project read starts carrying `catalogueItems` plus `itemCount`, `entryCount` and `progression: number | null` at Project, Block, Storey and Unit level, all zero or `null` until later tickets create Items.

Routes: `POST /projects/:id/catalogue-items { name }` with 409 `CATALOGUE_ITEM_NAME_TAKEN`; `PATCH /projects/:id/catalogue-items/:catalogueItemId { name }` with the same 409; `DELETE .../:catalogueItemId` with 409 `CATALOGUE_ITEM_IN_USE` and `details: { itemCount }`. Names trimmed, 1 to 60 characters, name key via the shared helper, unique on Project and name key. Writes return the full Project. The roll-up query module (average of Item Progression beneath a node, `null` for none, with an optional Subcontractor filter for the Field later) is created here so later tickets only add Items.

Spec: `.scratch/items-and-progression/spec.md`. ADR-0008 applies.

**Blocked by:** None (can start immediately)

**Status:** complete

- [x] The migration adds the three tables, the author-kind enum and every index and constraint the spec names; client generation and the seed still run
- [x] The full Project read carries `catalogueItems` ordered by name key and `itemCount`, `entryCount` and `progression` at every level, `progression` being `null` with no Items; covered at the HTTP seam
- [x] Add returns 201 with the full Project; 400 for a blank name or one over 60 characters; 409 on a name differing only by case or whitespace; 404 for an unknown Project
- [x] Rename accepts a name with the same 409; 404 for a Catalogue Item of another Project
- [x] Delete returns 409 `CATALOGUE_ITEM_IN_USE` with the count while any Item exists, 204 otherwise
- [x] The roll-up average is a pure function with a unit test, including the empty case
- [x] All three routes appear in the OpenAPI document
- [x] The Items tab lists, adds, renames and deletes with field errors, busy state and the in-use refusal inline; the tab is marked active; in both locales
- [x] The e2e fake implements the three routes and the e2e spec covers add, a taken name, rename, the in-use refusal and a successful delete
- [x] New components have a story and a test beside them

## Comments

### 2026-09-12 — implementation evidence (ticket agent)

Backend
- Migration `apps/backend/prisma/migrations/20260912090000_items_and_progression/migration.sql`: enum `ProgressAuthorKind`, tables `catalogue_items`, `items`, `progress_entries`, unique (projectId, nameKey) and (unitId, catalogueItemId), indexes (catalogueItemId), (subcontractorId), (unitId), (itemId, createdAt, id), FKs Cascade/Restrict per spec. `prisma validate` and `prisma generate` pass; seed untouched (additive schema).
- Roll-up query module `src/services/progress.service.ts`: pure `averageProgression` (null for empty), `rollUp`, `readUnitItemRows({ projectId, subcontractorId? })` for the Field's filter later. `src/services/project-read.ts` folds itemCount/entryCount/progression into Project, Block, Storey, Unit and adds `catalogueItems` ordered by name key.
- Routes POST/PATCH/DELETE `/projects/:id/catalogue-items[/:catalogueItemId]` (schema, service, controller) with 409 `CATALOGUE_ITEM_NAME_TAKEN` / `CATALOGUE_ITEM_IN_USE { itemCount }`; registered in OpenAPI.
- `pnpm --filter @daedalus/backend exec vitest run tests/unit/progress.service.test.ts` — 3 passed.
- `pnpm --filter @daedalus/backend exec vitest run tests/integration/catalogue-items.route.test.ts` — 20 passed (empty read, per-level averages, add/409/400/404, rename, delete 409 with count then 204, concurrent Restrict, 401s, OpenAPI paths and Project schema fields).
- Existing Project route tests updated for the new read shape (blocks, storeys, units, unit-types, structure, project-detail, project-create, project-edit-delete): 150 passed.
- `pnpm --filter @daedalus/backend typecheck` and `lint` — clean.

Frontend
- Items tab at `/projects/$id/items` (`ProjectItemsPage`, `CatalogueItemsTable`, `CatalogueItemForm`, `DeleteCatalogueItemDialog`, `catalogueItemsApi`, `useCatalogueItemMutations`, route `projects.$id.items.tsx`; third tab link in `ProjectLayout`); `Project`/`Block`/`Storey`/`Unit` types carry the roll-ups and `catalogueItems`. Strings in en-US and zh-CN (zh-CN machine-translated).
- `pnpm --filter @daedalus/frontend exec vitest run src/features/projects` — 21 files, 68 passed (10 new tests across the three new components; stories beside each).
- `pnpm --filter @daedalus/frontend exec playwright test e2e/project-items.spec.ts ... --project=chromium` — the 3 new Items specs passed (add, taken name on add and rename, rename, in-use refusal inline, confirmed delete, server-side refusal, Chinese at 390px with no horizontal scroll, active tab). Run together with the other Project specs sharing the fake: 38 passed, 1 failed (`project-units.spec.ts` focus-restoration assertion; it then passed 4/4 in isolation, so it reads as a timing flake under parallel load, not a regression).
- `pnpm --filter @daedalus/frontend typecheck` and `lint --max-warnings 0` — clean for this ticket's files (concurrent ticket 07 field files were mid-edit at the time).

