# Projects and Structure: stories 1–49

Checked 2026-09-11; final integrated verification 2026-09-12. This matrix uses the approved story numbers from
[the spec](../spec.md). Feature implementation reviews and per-ticket checks
were completed before this verification ticket; this pass reuses that evidence.
Final combined verification passed in the main workspace; all criteria are complete.

HTTP paths below are under `apps/backend/tests/integration/`; browser paths are
under `apps/frontend/e2e/`; component and helper paths are under
`apps/frontend/src/features/projects/`. Each reference identifies assertions
inspected, not merely a test file with a related name. HTTP tests drive
`createApp` through Supertest, mock Prisma, and use generated ES256 tokens with
stubbed JWKS. Browser tests exercise the running Console with an intercepted
provider and stateful API fake. Neither seam proves database constraints;
actual database observations are recorded separately below.

| Story | Evidence and verified behavior |
| --- | --- |
| 1 | Browser `projects.spec.ts`: Projects is the active navigation entry and renders the real list. |
| 2 | HTTP `projects.route.test.ts` asserts all three descendant counts; browser `projects.spec.ts` and component `ProjectsTable.test.tsx` assert code, name and count cells. |
| 3 | HTTP `projects.route.test.ts` / `projects-search.route.test.ts`: normalized order, paging, code/name matching, empty searches and literal wildcards. Browser `projects.spec.ts`: debounced search resets page and Previous/Next work. |
| 4 | Browser `projects.spec.ts`: distinct empty portfolio and no-match messages; component/page link and browser `project-create.spec.ts` verify the creation invitation leads to the form. |
| 5 | Browser `projects.spec.ts`: delayed loading, failed request and successful retry. |
| 6 | Browser `project-create.spec.ts`: New project header action opens the labelled name/code form. |
| 7 | HTTP `project-create.route.test.ts` rejects invalid fields and normalizes code; `ProjectForm.test.tsx` asserts associated required errors, uppercase input and Enter submission. |
| 8 | HTTP `project-create.route.test.ts` asserts normalized name/code conflicts; browser `project-create.spec.ts` maps both to associated field errors. |
| 9 | Browser `project-create.spec.ts`: creation navigates to the new Project and renders its returned identity. |
| 10 | Browser `project-detail.spec.ts`: heading, kicker, back link, Structure and Unit Types tabs with active state. |
| 11 | HTTP `project-edit-delete.route.test.ts`: independent valid fields, validation and both uniqueness conflicts; browser `project-edit-delete.spec.ts`: rename/code change, Cancel and updated list. |
| 12 | `DeleteProjectDialog.test.tsx` asserts name, descendant counts and explicit confirmation; browser `project-edit-delete.spec.ts` confirms navigation after deletion; real database typed cascade recorded below. |
| 13 | Browser `project-detail.spec.ts`: three panes respond to Block/Storey selection and show the selected Unit/type. |
| 14 | Browser `project-detail.spec.ts`: Block and Storey button accessible names include counts; HTTP `project-detail.route.test.ts` verifies descendant data. |
| 15 | Browser `project-detail.spec.ts`: selections update URL, survive reload and reopen the same pane. |
| 16 | Browser `project-detail.spec.ts`: empty Structure and catalogue guide the next step in both locales; `StructurePane.test.tsx` checks labelled empty content. |
| 17 | `BlocksPane.test.tsx`, `StoreysPane.test.tsx`, `UnitsPane.test.tsx`: Add submits one name and clears the form; browser Blocks and Units flows also exercise single creation. |
| 18 | `name-generator.test.ts`: prefix/start/end/padding/suffix; browser `project-blocks.spec.ts`, `project-storeys.spec.ts`, `project-units.spec.ts`: range batches through every pane. |
| 19 | `name-generator.test.ts`: pasted line trimming and blank dropping; the three batch browser specs switch to List and submit/check names. |
| 20 | `BatchNamesForm.test.tsx` and Blocks browser flow assert preview and total; `UnitBatchForm.test.tsx` and Units browser flow assert multiplied total across Storeys. |
| 21 | `BatchNamesForm.test.tsx`, `StoreysPane.test.tsx`, `UnitBatchForm.test.tsx`: existing/repeated name markings and disabled submit; each pane's browser spec verifies clash prevention. |
| 22 | `UnitBatchForm.test.tsx`: selected Storey pre-ticked, select-all, deselect one and submitted ids; browser `project-units.spec.ts` fills three Storeys together. |
| 23 | Same Unit batch component/browser tests assert the selected Unit Type is applied to every new Unit; HTTP `units.route.test.ts` asserts typed rows. |
| 24 | HTTP `blocks.route.test.ts`, `storeys.route.test.ts`, `units.route.test.ts`: all clashing spellings and no inserts; each batch browser spec simulates concurrent winner and retains preview; real database rollback below. |
| 25 | HTTP `project-detail.route.test.ts`: every list ordered by position then id, including ties; batch HTTP suites assert appended positions follow supplied order; real database concurrent positions below. |
| 26 | HTTP Blocks/Storeys/Units suites: scoped rename and sibling conflict; matching browser specs rename existing rows in place. |
| 27 | `UnitCard.test.tsx`: name and code; `UnitsPane.test.tsx` and browser `project-units.spec.ts`: change, clear and display Unit Type inline while preserving Unit identity. |
| 28 | `BlocksPane.test.tsx` / `StoreysPane.test.tsx`: nonzero descendant counts, Cancel and confirm; matching browser specs delete and refresh selection; real database cascades below. |
| 29 | `UnitsPane.test.tsx` and browser `project-units.spec.ts`: named confirmation, cancellation and successful removal with a surviving focus target. |
| 30 | HTTP `project-detail.route.test.ts`: code-key catalogue order and derived use counts; `UnitTypesTable.test.tsx` and browser `project-detail.spec.ts`: real table, description and count. |
| 31 | HTTP `unit-types.route.test.ts`: code normalization, scoped uniqueness, partial edit and description clearing; `UnitTypeForm.test.tsx` plus browser `project-unit-types.spec.ts`: add/edit and field errors. |
| 32 | HTTP `unit-types.route.test.ts`: precheck refusal and concurrent-use FK refusal with fresh count; browser `project-unit-types.spec.ts` verifies both messages and refreshed count; real database refusal below. |
| 33 | Browser creation/edit/delete and pane mutation flows assert immediate server-derived screen updates; Project edit browser flow returns to the list and asserts updated identity. Existing mutation hooks were inspected: create/edit writes full detail and invalidates list, deletion invalidates Project queries. |
| 34 | Browser `projects.spec.ts`, `project-create.spec.ts`, `project-detail.spec.ts`: active Projects sidebar on list, form and nested screens; Console NavLink matches the Projects path prefix. |
| 35 | Browser `project-detail.spec.ts`: missing Project renders not found with working back link; HTTP `project-detail.route.test.ts`: 404. |
| 36 | Chinese browser flows for list/create/edit/delete/detail/Unit Types and Chinese component assertions for batch/Storeys/Units. Locale inspection found all 194 English Projects leaves translated, using Chinese plural equivalence where appropriate; native-review flag retained. This verifies supplied translations, not native linguistic review. |
| 37 | Browser `project-detail.spec.ts`: 390px pane bounding boxes stack, headings name selected parents, document width stays inside viewport. |
| 38 | Browser `project-accessibility.spec.ts`: Tab/Enter pane rows, Add many forms and all three Structure delete dialogs, Escape and restored trigger focus. Project delete browser spec checks focus containment/restoration; Unit Types browser checks dialog focus. Native controls plus component keyboard/focus tests cover the shared forms. No physical screen-reader session is claimed. |
| 39 | `ProjectsTable.test.tsx`, `UnitTypesTable.test.tsx`, `StructurePane.test.tsx`: native table/list semantics and labels; `ProjectForm.test.tsx` and creation browser assertions check field error associations. |
| 40 | Browser `auth.spec.ts` guards list; `project-create.spec.ts` guards creation; `project-accessibility.spec.ts` guards detail, Unit Types and upload direct URLs. |
| 41 | HTTP `projects-contract.route.test.ts`: all 17 manual-Structure operations reject both missing and invalid tokens before data access. Signed-token route suites verify authorized behavior. |
| 42 | HTTP Blocks/Storeys/Units/Unit Types suites assert foreign Project child 404, foreign Block Storey rejection and foreign Unit Type rejection on both create/edit. |
| 43 | Batch HTTP suites assert complete ordered responses, no partial writes and serialization retry; `tests/unit/structure-transaction.test.ts` tests bounded recognized COMMIT retries; actual database concurrent/atomic batches below. |
| 44 | Migration inspected and actual database uniqueness/Restrict probe passed; HTTP conflict/race cases assert stable Project/Block/Storey/Unit/Unit Type codes. `tests/unit/name-key.test.ts` checks normalization including whitespace. |
| 45 | HTTP create/edit suites assert full Project response. Deletes intentionally return 204 per the spec's more specific API contract; clients use the empty-response helper and invalidate/refetch. This resolves the story's overbroad “every write” wording. |
| 46 | HTTP `projects-contract.route.test.ts` fetches `/openapi.json` and verifies all 17 operations, bearer security, path parameters, required JSON bodies and success response schemas (204 has no body). Upload operations are verified by ticket 14. |
| 47 | Signed-token mocked-Prisma HTTP suites and stateful browser-edge fake specs above exercise the intended seams. Live database checks supplement rather than replace them. |
| 48 | Presentational inventory confirms 13 manual-Structure component/story/test triples: ProjectsTable, ProjectForm, DeleteProjectDialog, StructurePane, BlocksPane, StoreysPane, UnitsPane, BatchNamesForm, UnitBatchForm, UnitCard, UnitTypesTable, UnitTypeForm, DeleteUnitTypeDialog. Page/query/mutation containers are not presentational components. Three additional upload triples are ticket 14's scope. |
| 49 | Removed unused `components/ui/Placeholder/`, its Page test usage, and both `console.notBuilt` keys. Root/frontend README and SPEC describe the shipped feature. Earlier archived design/verification documents retain historical evidence; SPEC marks the old screens superseded. |

## Database, security and integration evidence reused

[Prerequisites and integration observations](prerequisites.md) record actual
runtime skill discovery, dependency/browser availability, the additive migration,
constraint probe, and two seed runs. They also record full Project creation/read,
normalized 409s and typed Project cascade through authenticated HTTP against
`daedalus2`; concurrent disjoint and identical Block/Storey batches, atomic clash
refusal and scoped name reuse; Unit Type use refusal/description clearing; and
ten Unit scenarios including 2,000 Units and competing Unit Type deletion.
Temporary verification Projects were cleaned up, without changing existing data.

One initial concurrent pair returned an uncaptured 500. The original cause is
unconfirmed; 230 diagnostic pairs passed. Inspection found a specific Prisma
COMMIT serialization error form that bypassed retry; the bounded fix has 12
regressions, and all live Unit scenarios subsequently passed. This record does
not retroactively identify the original failure.

Combined root lint/typecheck/unit/integration checks and targeted browser runs
passed at each implementation integration, as recorded in tickets 01–08 and the
prerequisite record. Chromium, Firefox and WebKit all run on this host. Final
root/build/backend and frontend Playwright results are recorded below from the
main workspace after both verification tickets integrated.

The dependency audit has 15 pre-existing advisories (8 moderate, 5 high, 2 critical)
and no newly introduced advisory pair. The existing local database URL defaults
can select `public`; use the explicitly configured `daedalus2` URL. Both issues
remain separately tracked follow-ups. Chinese remains machine-translated and
flagged for native review. No additional manual-Structure acceptance gap was found.

## Ticket 09 changes and targeted checks

The generated OpenAPI document exposed six Block/Storey/Unit create/edit bodies
as optional despite HTTP requiring them. Their three registration loops now mark
bodies required. The 34-case contract sweep passes, including schemas and both
auth failures for all 17 operations. The changed Page composition test passes
(2 cases), and targeted backend/frontend ESLint passes with zero warnings.

CONTEXT's Storey/Unit definitions now distinguish workbook padding/order from
manually chosen names/order, matching the approved spec. ADR-0005 already agrees
with per-Project type ownership, same-Project validation and delete refusal.
Unrelated Item/Progression glossary edits were preserved.

The new browser spec passes all 4 Chromium scenarios using isolated Vite on
port 5209 with the real shared font directory allowed. Temporary runner configs
were removed. Final integration runs the normal config across all three engines.

## Final combined verification — 2026-09-12

All reviewed tickets are integrated in the main workspace without staging or
committing. Root `pnpm build`, `pnpm lint`, `pnpm typecheck` and `pnpm test`
passed: backend 31 files / 378 unit and integration tests; frontend 48 files /
155 unit and component tests. Backend Playwright passed 2 cases. The final full
frontend Playwright run passed all 288 cases across Chromium, Firefox and WebKit
in 2.1 minutes. These results also close ticket 14's combined gate.

The first combined browser run passed 280/288. Its eight failures exposed test
setup and navigation assumptions: two auth scenarios needed the real Projects
API fake and the Chinese assertion still expected the removed placeholder;
WebKit's clock could advance past `pauseAt(new Date())`; Firefox's forward-only
keyboard helper wrapped into development tools when seeking an earlier control.
The fixtures/assertions now match the shipped screen, the clock uses a fixed
future pause point, and the helper uses Tab or Shift+Tab according to DOM order.
It still reaches controls using keyboard events. Nine auth/search checks and
three keyboard checks passed before the clean full run. No production code
changed during these final repairs. Prettier passes for all three changed e2e
files. Repository ESLint does not include e2e files; the explicit e2e lint probe
reported ignored-file warnings, so it is not claimed as lint coverage.

Build/lint/type/unit results were reused after these test-only changes. Session
logs are `/tmp/daedalus-final-{build,lint,types,tests}.log`,
`/tmp/daedalus-final-e2e.log` (backend pass and initial frontend failures), and
`/tmp/daedalus-final-e2e-clean.log` (clean full frontend run). These local logs
are temporary; the durable counts and limitations are recorded here.

Final repository checks passed: `git diff --check`, no staged changes, unchanged
handoff snapshots, and no original workbook copies or temporary browser configs.
All 49 stories are accounted for above; no approved criterion remains open.
