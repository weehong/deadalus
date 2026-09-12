# 02: Apply a Catalogue Item to a set of Units

**What to build:** From a Catalogue Item's row on the Items tab, an Administrator chooses "Apply to Units" and picks a Block (or all), then Storeys and Unit Types with select-all, watching a live line computed from the loaded Project: "Will add N Items; M Units already hold it". Submitting creates one Item in every selected Unit that has none for this Catalogue Item, shows the result counts, and the Units-holding-it column and Progression badges update from the returned Project. Applying the same selection again is safe: everything is skipped.

Route: `POST /projects/:id/catalogue-items/:catalogueItemId/items { blockIds?, storeyIds?, unitTypeIds? }`. A Unit is selected when it matches every filter given; no filters selects every Unit of the Project. Every id must belong to the Project or the request is a 404. One transaction, bulk insert skipping duplicates; 201 with the full Project and `meta: { added, skipped }`. Items start at Progression 0 with no Assignment. The Unit selection is one presentational component reused by tickets 03 and 04.

Spec: `.scratch/items-and-progression/spec.md`. ADR-0008 applies.

**Blocked by:** 01 (The Item Catalogue and its tab)

**Status:** complete

- [x] The selection filter (intersection of the given filters, everything when none) is a pure function with a unit test
- [x] Apply returns 201 with the full Project and correct `added` and `skipped` for: no filters, one Block, Storeys of one Block, Unit Types across Blocks, and a repeat apply that skips everything; covered at the HTTP seam
- [x] 400 for an empty array filter; 404 for a Block, Storey, Unit Type or Catalogue Item of another Project
- [x] The full Project's `itemCount` at every level and the Catalogue Item's `itemCount` reflect the new Items; `progression` becomes 0 where Items now exist
- [x] The route appears in the OpenAPI document
- [x] The Unit selection is a presentational component over a plain value with `onChange`, its count line computed client-side from the Project; it has a story and a test
- [x] The dialog submits, shows busy state, shows the result counts and closes; in both locales
- [x] The e2e fake implements the route and the e2e spec covers a whole-Project apply, a filtered apply and a repeat apply showing skips

## Comments

### 2026-09-12 — implementation evidence (ticket agent)

Backend
- `src/services/unit-selection.ts`: pure `selectUnits(units, { blockIds?, storeyIds?, unitTypeIds? })`, intersection of the filters given, everything when none, a Unit without a Unit Type never matching a Unit Type filter. `tests/unit/unit-selection.test.ts` — 5 passed.
- `src/schemas/unit-selection.schema.ts`: `unitSelectionBodySchema` (each list optional, non-empty, ≤ 2000 ids) and `applyMetaSchema`, for tickets 03 and 04 to reuse.
- `applyCatalogueItem` in `src/services/catalogue-items.service.ts`: one transaction; 404 for a Catalogue Item, Block, Storey or Unit Type outside the Project before any write; `item.createMany` with `skipDuplicates`; `meta: { added, skipped }` with `skipped = selected − added`; full Project read in the same transaction. Controller and route `POST /projects/:id/catalogue-items/:catalogueItemId/items` (201); registered in OpenAPI with the `{ data, meta }` schema. `ApiResponse<T, M = PaginationMeta>` in `src/types/api.ts` gained the meta type parameter (backwards compatible).
- `pnpm --filter @daedalus/backend exec vitest run tests/integration/apply-catalogue-item.route.test.ts` — 20 passed: no filters, one Block, Storeys of one Block, Unit Types across Blocks (untyped Unit excluded), an empty Block (0/0), repeat apply skipping everything (3+2, then 0+5), another Catalogue Item kept apart, itemCount at Project/Block/Storey/Unit and on the Catalogue Item with `progression` 0 where Items exist and `null` elsewhere, 400 for six empty or malformed filters with no transaction, 404 for a Block, Storey, Unit Type or unknown id of another Project and for a foreign or unknown Catalogue Item or Project with no write, 401, OpenAPI path with 201/400/401/404 and `meta.added`/`meta.skipped`. Ticket 01's `catalogue-items.route.test.ts` still 20 passed.
- `pnpm --filter @daedalus/backend typecheck` and `lint` — clean.

Frontend
- `src/features/projects/unit-selection.ts` (pure, for tickets 03 and 04): `UnitSelectionValue` (`blockId | null`, explicit `storeyIds`, `unitTypeIds`), `storeysOf`, `selectAll`, `toUnitSelectionBody` (a list travels only when it narrows its scope), `isValidSelection`, `selectUnits` (the API's rule), `holdingBounds(project, selected, catalogueItem) → { min, max }`. `unit-selection.test.ts` — 13 passed.
- `UnitSelection.tsx` (presentational: Block select All/one, Storey and Unit Type checkbox lists with select-all, Storeys named `Block · Storey` when all Blocks, `summary` line as `role="status"`), story with three states, `UnitSelection.test.tsx` — 3 passed.
- `ApplyCatalogueItemDialog.tsx` (preview line, busy, error, result counts with Close focused), story with four states, test — 3 passed. `catalogueItemsApi.applyCatalogueItem` over `apiFetchEnvelope<T, M>` (meta type parameter added in `common/api.ts`), `useCatalogueItemMutations().apply` writing the returned Project into the cache, "Apply to Units" row action in `ProjectItemsPage`. Strings under `projects.selection` and `projects.apply` in en-US and zh-CN (zh-CN machine-translated).
- `pnpm --filter @daedalus/frontend exec vitest run src/features/projects` — 24 files, 87 passed. `typecheck` and `lint --max-warnings 0` — clean.
- e2e: `e2e/catalogue-items-api.ts` gained `handleApplyCatalogueItem` (400 for an empty list, 404 for a foreign id, Items pushed onto `FakeUnit.items`, `meta` counts), dispatched from `e2e/projects-api.ts`. `e2e/project-apply-items.spec.ts` — 4 passed (whole-Project apply with the request body asserted as `{}` and the row count surviving a reload; one Block's Unit Type with body `{ blockIds: ["a"], unitTypeIds: ["as1"] }` and one skip; repeat apply skipping all 5 and an emptied selection disabling Apply; Chinese at 390px with no horizontal scroll). Run with `project-items.spec.ts` and `project-accessibility.spec.ts`: 11 passed.

Note for the parent (spec gap, not a defect of this ticket): the full Project read carries each Unit's `itemCount` and each Catalogue Item's `itemCount`, not which Catalogue Items a Unit holds, so the client-side "already hold it" count is exact for the whole Project, for a Catalogue with one entry, and wherever the per-Unit counts settle it (a Unit holding none or every Catalogue Item), and otherwise the tightest range those counts allow, worded "Will add 0 to 1 Items; 0 to 1 Units already hold it". The server's `meta` is the authority. Tickets 03 and 04 will meet the same limit (04's "assigned elsewhere" is not in the read at all); widening the Project read with per-Unit `catalogueItemIds` would make every preview exact if wanted.

### 2026-09-12 — follow-up: exact preview from a per-Unit Items summary (ticket agent)

Per the coordinator's decision (user story 6), the range logic is gone and the preview is exact.
- Full Project read: every Unit now carries `items: Array<{ catalogueItemId, subcontractorId }>` ordered by Catalogue Item id (`progress.service.ts` `UnitItemRow` gained both ids; `project-read.ts` summarises the rows it already fetched for the roll-ups; `unitItemSummarySchema` in `project-detail.schema.ts`, so the OpenAPI `Project` schema carries it). Names and entries stay on the Unit card's separate Items read.
- Frontend: `Unit.items` in `types.ts`; `holdingCount(selected, catalogueItemId)` replaces `holdingBounds`; the dialog words "Will add N Items; M Units already hold it" only; `addRange`/`holdRange` removed from both locales. `selectUnits` and `toUnitSelectionBody` unchanged for tickets 03 and 04.
- e2e fake: `FakeItem.subcontractorId?` (null by default) and `fullProject` derives each Unit's `items` from `FakeUnit.items`. Fixture literals in `BlocksPane`, `StoreysPane`, `UnitBatchForm`, `UnitsPane` tests and stories gained `items: []`; ticket 01's `catalogue-items.route.test.ts`, `project-detail.route.test.ts` and `progress.service.test.ts` updated for the new row and Unit shapes.
- `pnpm --filter @daedalus/backend exec vitest run tests/unit/unit-selection.test.ts tests/unit/progress.service.test.ts tests/integration/apply-catalogue-item.route.test.ts tests/integration/catalogue-items.route.test.ts tests/integration/project-detail.route.test.ts` — 54 passed (apply asserts the per-Unit summary after an apply and the OpenAPI Unit `items` properties). Backend `typecheck` and `lint` — clean.
- `pnpm --filter @daedalus/frontend exec vitest run src/features/projects` — 24 files, 84 passed (`holdingCount` exact for whole Project, one Block, one Storey, one Unit Type, an Item applied nowhere and an empty selection; the dialog counts only Items made from the chosen Catalogue Item). Frontend `typecheck` and `lint --max-warnings 0` — clean.
- `pnpm --filter @daedalus/frontend exec playwright test e2e/project-items.spec.ts e2e/project-apply-items.spec.ts e2e/project-detail.spec.ts --project=chromium` — 11 passed; every preview and result line asserts an exact number.
- Not changed: `e2e/units-api.ts` and `e2e/structure-api.ts` still answer with the raw fake Project (no roll-ups, no `items`), as they did before this feature; they never open the apply dialog, so nothing reads `items` there.

