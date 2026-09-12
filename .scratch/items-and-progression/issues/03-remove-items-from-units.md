# 03: Remove a Catalogue Item's Items from a set of Units

**What to build:** From a Catalogue Item's row, an Administrator chooses "Remove from Units", makes the same Unit selection, and is asked to confirm with the number of Items and the number of Progress entries that will go. Submitting deletes those Items with their entries and shows the counts; the tab and the badges update.

Route: `POST /projects/:id/catalogue-items/:catalogueItemId/items/remove { blockIds?, storeyIds?, unitTypeIds? }` with the same selection semantics as apply. 200 with the full Project and `meta: { removed, entriesRemoved }`; entries go by cascade, the count read inside the transaction before the delete.

Spec: `.scratch/items-and-progression/spec.md`. ADR-0008 applies.

**Blocked by:** 02 (Apply a Catalogue Item to a set of Units)

**Status:** complete

- [x] Remove returns 200 with the full Project and correct `removed` and `entriesRemoved`; a selection holding no Items returns zeros; covered at the HTTP seam
- [x] 404 rules as for apply
- [x] The route appears in the OpenAPI document
- [x] The confirmation names the Item and entry counts computed client-side from the full Project's per-level counts, and the dialog shows the result; in both locales
- [x] The e2e fake implements the route and the e2e spec covers a remove with entries and a remove that matches nothing

## Comments

### 2026-09-12 — implementation evidence (ticket agent)

Backend
- `POST /projects/:id/catalogue-items/:catalogueItemId/items/remove`: `removeCatalogueItem` in `src/services/catalogue-items.service.ts` (one transaction; 404 for a Catalogue Item, Block, Storey or Unit Type outside the Project before any write, as apply; `progressEntry.count` over the selected Units' Items for this Catalogue Item read before `item.deleteMany` on the same `where`, entries going by cascade; full Project read in the same transaction; `meta: { removed, entriesRemoved }`), `removeMetaSchema`/`RemoveMeta` in `src/schemas/unit-selection.schema.ts`, `removeCatalogueItemController` (200), route in `src/routes/projects.route.ts`, path registered in `src/openapi/registry.ts` with the `{ data, meta }` schema.
- `pnpm --filter @daedalus/backend exec vitest run tests/integration/remove-catalogue-item.route.test.ts` — 21 passed: whole Project (4 removed, 6 entries; the count asserted to run before the delete; another Catalogue Item's Items and entries kept; roll-ups and per-Unit `items` after), one Block, Storeys of one Block, Unit Types across Blocks (untyped Unit kept), zeros for an empty Block, a Storey holding none and a Catalogue Item applied nowhere, 400 for six empty or malformed filters with no transaction, 404 for a Block, Storey, Unit Type or unknown id of another Project and for a foreign or unknown Catalogue Item or Project with nothing deleted, 401, OpenAPI path with 200/400/401/404 and `meta.removed`/`meta.entriesRemoved`.
- `tests/integration/apply-catalogue-item.route.test.ts` and `catalogue-items.route.test.ts` — 40 passed. `pnpm --filter @daedalus/backend typecheck` and `lint` — clean.

Frontend
- `removalCounts(selected, catalogueItemId) → { items, entries, entriesExact }` in `src/features/projects/unit-selection.ts`: the Item count is exact (one per selected Unit holding the Catalogue Item); a Unit's `entryCount` covers all its Items, so the entries figure is exact only when every affected Unit holds that Item alone or carries no entries, and otherwise an upper bound. `unit-selection.test.ts` gained 3 tests for it.
- `RemoveCatalogueItemDialog.tsx` (presentational; `UnitSelection` with "Will remove N Items." then Continue; a confirmation step with the selection frozen, "Remove N Items and M Progress entries? This cannot be undone." or "… and up to M Progress entries?" when the loaded Project cannot settle it, with Back and Remove; then the API's "Removed N Items and M Progress entries." with Close focused), story with five states (`defaultConfirming` prop for the confirmation states), `RemoveCatalogueItemDialog.test.tsx` — 3 passed. `catalogueItemsApi.removeCatalogueItemFromUnits`, `useCatalogueItemMutations().removeFromUnits` writing the returned Project into the cache, "Remove from Units" row action in `ProjectItemsPage`. Strings under `projects.removeItems` in en-US and zh-CN (zh-CN machine-translated).
- `pnpm --filter @daedalus/frontend exec vitest run src/features/projects` — 25 files, 90 passed. `typecheck` and `lint --max-warnings 0` — clean.
- e2e: `e2e/catalogue-items-api.ts` — the apply handler's selection parsing (400/404) factored into `resolveSelection`, shared with the new `handleRemoveCatalogueItem` (Items dropped from `FakeUnit.items`, entries summed into `meta`), dispatched from `e2e/projects-api.ts`. `pnpm --filter @daedalus/frontend exec playwright test e2e/project-remove-items.spec.ts --project=chromium` — 4 passed: whole-Project remove with entries (preview 3 Items, confirmation "up to 6" because a Unit also holds a Sink, body `{}`, result "3 Items and 3 Progress entries", row count 0 surviving a reload, Sink untouched); Back to narrow to one Block's Unit Type with an exact "1 Progress entry" and body `{ blockIds: ["a"], unitTypeIds: ["bp2"] }`; a selection holding none of the Item (zeros end to end) and an emptied selection disabling Continue; Chinese at 390px with no horizontal scroll. Run with `project-apply-items`, `project-items`, `project-detail` and `project-accessibility`: 15 passed.

Note for the parent: the per-Catalogue-Item entry count is not derivable from the full Project read (a Unit's `entryCount` spans all its Items), so the confirmation names the Item count exactly and gives the entries exactly where the read settles it and as an honest upper bound ("up to") elsewhere; the server's `meta` is shown after the remove. Ticket 04's agent has copied `readSelectableUnits` into `src/services/selectable-units.ts`; the original in `catalogue-items.service.ts` (used by apply and remove) can be swapped for that import at integration.
