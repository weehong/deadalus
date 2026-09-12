# 10: Verify and document Items, Progression and the Field

**What to build:** The combined verification and the documentation. Run the root lint, typecheck and test suites and the full e2e set across the three browsers, including the Field specs at phone width. Update the README (the Field, `MEMBER_TOKEN_SECRET`, the phone-only proof-of-concept caveat pointing at ADR-0009) and SPEC.md to describe Items, Progression and the Field as built. Confirm the glossary matches what shipped. Record the outcome as evidence on this ticket.

Spec: `.scratch/items-and-progression/spec.md`.

**Blocked by:** 03 (Remove a Catalogue Item's Items from a set of Units), 06 (Progression on Structure rows and the Projects list), 09 (The Field's Unit screen: Items and Progress entry)

**Status:** complete

- [x] Root lint, typecheck and unit and integration suites pass
- [x] All e2e specs pass on Chromium, Firefox and WebKit with the normal workspace configuration
- [x] README and SPEC.md updated; the backend's example environment file lists `MEMBER_TOKEN_SECRET`
- [x] The glossary is reviewed against the shipped behaviour and any drift corrected
- [x] The dev seed runs idempotently on an empty database and after itself

## Comments

### Review refactor (backend, e2e fakes, exact remove counts) — 2026-09-12

Review-stage refactor of `a6fc634..HEAD`, backend and e2e fakes; behaviour unchanged except the Remove confirmation.

- **Exact Remove confirmation (story 8).** The per-Unit Item summary in the full Project read now carries `entryCount` (`unitItemSummarySchema`, OpenAPI via the schema; `project-read.ts` `summarise` reads it from the roll-up rows it already had). The client's `removalCounts` sums the going Items' own entries, so the confirmation says exactly what the API then reports; the `confirmAtMost` ("up to") wording and the `entriesExact` flag are gone from `unit-selection.ts`, the dialog and both locales. The e2e fake's `fullProject` derives it per Item; `project-remove-items.spec.ts` asserts "3 Items and 3 Progress entries" before and after.
- **Thin controller.** `enterConsoleProgress(projectId, itemId, body, user)` in `progress-entries.service.ts` composes the Administrator author and the transactional `readUnitItems` callback, mirroring the Field's `enterFieldProgress`; the controller is one call per route.
- **Vocabulary.** `progress.service.ts` → `progression.service.ts` (and its unit test); imports updated.
- **Duplication.** (a) `services/delete-unless-held.ts`: count → delete → on P2003 recount and 409, shared by `deleteCatalogueItem` and `deleteSubcontractor` (the latter drops its non-serializable count-and-delete transaction, which gave no guarantee the restrict FK does not; HTTP behaviour and the delete tests are unchanged). (b) `rowsBeneath(structure, rows)` in the progression service indexes the rows beneath every Block, Storey and Unit in one walk; `toProject` and `toFieldProject` both fold over it and lose their nested flatMaps (the two mapping walks stay separate because their outputs differ: nullable roll-ups on every node vs held-only nodes). (c) `readUnitItemRows` and `readRollupsByProject` share `unitItemRowSelect` and `toUnitItemRow`. (d) `services/item-scope.ts`: one `ItemScope` (`{ projectId } | { subcontractorId }`) with `itemWhere(scope)` and `inProject(projectId)`, used by `progress-entries.service.ts` (`requireItem`), `unit-items.service.ts` (`readItems(scope, unitId)`) and the roll-up read (`readUnitItemRows(projectId, scope = { projectId })`); `RollupScope` and the `Pick<ItemWhereInput>` encoding are gone. Nothing was skipped.
- **e2e fakes.** `e2e/fake-shared.ts` holds `nameKey`, `ASSIGNED_AT`, `normalizePhone`, `rollUp` and `nextEntry(author, value, note)`; `field-api.ts`, `assignments-api.ts`, `catalogue-items-api.ts`, `progress-entries-api.ts` (and `subcontractors-api.ts`, whose `normalizePhone` was the byte-identical original) import from it.

Verification:
- `pnpm --filter @daedalus/backend typecheck` and `lint`: clean. `pnpm --filter @daedalus/backend exec vitest run`: 44 files, 561/561 passed (four `toEqual` summary assertions in `apply-catalogue-item` and `assignments` route tests gained `entryCount`; nothing else changed).
- `pnpm --filter @daedalus/frontend typecheck`: clean. `pnpm --filter @daedalus/frontend lint`: 4 errors, all in files owned by the concurrent frontend refactor (`components/progress/ProgressEntryPanel/*`, `features/field/FieldQueryState.test.tsx`, `features/field/FieldUnitPage.tsx`); none in the files touched here.
- `vitest run src/features/projects/unit-selection.test.ts src/features/projects/RemoveCatalogueItemDialog.test.tsx`: 15/15 passed.
- `playwright test e2e/project-remove-items.spec.ts e2e/project-apply-items.spec.ts e2e/project-assign-items.spec.ts e2e/project-progress.spec.ts e2e/project-progression.spec.ts e2e/field-unit.spec.ts e2e/field-drill-down.spec.ts e2e/field-auth.spec.ts --project=chromium`: 47/47 passed.

### Review refactor (frontend) — 2026-09-12

Behaviour-preserving refactor of the frontend from the review of `a6fc634..HEAD`.

- Cross-feature imports: `ProgressionBadge`, `ProgressHistory`, `ProgressEntryForm` moved to `src/components/progress/<Name>/` (component, story, test, index each); `formatDateTime`, `progressEntryFailure` and the shared `UnitItem`/`LatestEntry`/`ProgressEntry`/`ProgressEntryInput` types moved to `src/common/` (`format-date-time.ts`, `progress-entry-failure.ts` + test, `items.ts`). Nothing under `features/field` imports `features/projects` any more, nor the reverse.
- Vocabulary: `ItemProgress` and `FieldItemProgress` are gone (see next); `Level` in `FieldProjectPage.tsx` is `FieldNodeScreen`; `projects.blocks.deleteConfirm` and `projects.storeys.deleteConfirm` now say Storeys/Units (zh-CN has no capitalisation to mirror).
- Duplicates: one shared `ProgressEntryPanel` (takes the history hook and the entry callback as props) replaces `ItemProgress` and `FieldItemProgress`; a shared `LatestEntryLine` replaces the latest-entry line in `ItemRow` and `FieldItemRow`; `FieldProgressEntryForm` is gone, the Field's thumb preset is two documented constants in `FieldUnitPage.tsx` (and a `Thumb` story plus a class test on `ProgressEntryForm`).
- Fetch helper: `common/api.ts` `apiRequest`/`apiFetch` take `{ getToken, onUnauthorized }` options with the Administrator defaults; `features/field/api.ts` `fieldFetch` is now `apiFetch` with the Member token and the 401 hook.
- Query state: `FieldQueryState` (pending / not-found with a way back / error with Retry) and `FieldBackLink` extracted with stories and tests; the three Field pages use them.
- `ProjectItemsPage`: the four dialogs own their submission (`useSubmission`: pending, failure line, result) and take a promise-returning `onSubmit`/`onConfirm`; the page tracks only `{ kind, catalogueItem }` for the open dialog, the rename row, the row failure and the Assign search. Dialog tests and stories adjusted for the changed props (stories drive the busy/failed/done states through `play`).
- e2e touched only for copy: `project-blocks`, `project-storeys`, `project-progression` assert the capitalised delete confirms; `assignments-api.ts` and `field-api.ts` import `UnitItem` from `src/common/items`.

Verification: `pnpm --filter @daedalus/frontend typecheck` clean; `lint` clean (0 warnings); `vitest run src/` 73 files, 249 tests passed; Playwright (chromium) `project-items`, `project-apply-items`, `project-assign-items`, `project-progress`, `project-progression`, `project-units`, `project-accessibility`, `field-unit`, `field-drill-down`, `field-auth`: 52 passed; plus `project-blocks`, `project-storeys`, `project-remove-items`: 8 passed.

2026-09-12 combined verification (parent integration):

- Code review since a6fc634 ran on two axes (Standards, Spec). Findings acted on: shared components moved out of the Projects feature into the shared components directory and common modules; controllers thinned; roll-up service renamed to progression; vocabulary fixes (Level, copy capitalisation); Console/Field entry components unified; fetch helper parameterised instead of duplicated; Field query-state and back-link components extracted; Items page dialogs own their submission state; backend delete-unless-held, item-scope and structure-fold helpers shared; e2e fake helpers shared; the Remove confirmation made exact by adding entryCount to the per-Unit Item summary. Left as is: the Field Unit read returns heading fields plus items rather than a bare array (defensible reading of the contract).
- One Firefox failure in the first full run (a 44px control measured 43.99999px) fixed by rounding the tap-target measurement in the three Field specs.
- Root typecheck and lint (--max-warnings 0): clean for both apps.
- Unit and integration suites: backend 44 files, 561 tests; frontend 73 files, 249 tests; all passing.
- Full Playwright suite on Chromium, Firefox and WebKit with the normal workspace configuration: 441 passed.
- README (routes table, "Items, Progression and the Field" section with the ADR-0009 caveat, env table), SPEC.md section 18, `apps/backend/.env.example` (MEMBER_TOKEN_SECRET) and CONTEXT.md (Item Catalogue is the Items tab) updated.
- Migration `20260912090000_items_and_progression` applied with `prisma migrate deploy` to the local Docker PostgreSQL in schema `daedalus2`; the seed run twice gave the same counts (3 Catalogue Items, 18 Items, 8 Assignments, 5 Progress entries) and all 18 Items' stored Progression equals their latest entry. The hosted Supabase database was not contacted.
