# 03: Open a Project's screen with its Structure and Unit Types tabs

**What to build:** Clicking a row in the Projects list opens the Project's screen: the name as the heading, the code as the kicker, a way back to the list, and two tabs, Structure and Unit Types. The Structure tab shows three panes: Blocks, Storeys of the selected Block, Units of the selected Storey. Block rows show Storey and Unit counts, Storey rows show Unit counts, Unit cards show name and Unit Type code. The selected Block and Storey live in the URL search params; with none given, the first Block and its first Storey are selected, and selecting a Block selects its first Storey. An empty pane says what to add next. On a phone the panes stack vertically with the selected Block and Storey named in the pane headings. The Unit Types tab lists code, description and Unit count as a table. A Project that no longer exists shows a "not found" state with a way back. This issue builds the read-only screen; adding, renaming and deleting arrive in 04 to 08.

Underneath: `GET /projects/:id` returns the full Project (blocks with storeys with units, each ordered by position; unitTypes ordered by code key with unitCount), registered in the OpenAPI document. A layout route `/projects/$id` renders the header and tabs; `/projects/$id/` renders Structure and `/projects/$id/unit-types` the catalogue. The Project query hook is keyed by id; the fake implements the read.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 01 (Projects list, paged and searchable)

**Status:** complete

- [x] The read route returns the full Project shape from the spec with every list ordered by position (Unit Types by code key), 404 for an unknown id, 401 without a token; covered at the HTTP seam
- [x] The read route appears in the OpenAPI document
- [x] The layout route shows kicker, heading, back link and two tab links with `aria-current`; the sidebar entry stays active
- [x] The Structure tab renders three labelled lists with counts, selection reflected in `block` and `storey` search params, default selection rules, inverted selected rows marked `aria-current`, and empty-pane guidance, in both locales
- [x] Below the narrow breakpoint the panes stack in one column and each heading names its parent selection
- [x] The Unit Types tab renders a real table with column headers and an empty state
- [x] The not-found state renders with a way back
- [x] The e2e fake implements the read and the e2e spec covers opening a Project, selecting a Block and a Storey via the URL, both tabs, the not-found state and the phone-width layout
- [x] New presentational components each have a story and a test beside them

## Comments

### Implementation evidence (2026-09-11)

- Added guarded full Project read, nested deterministic ordering, transport schema,
  OpenAPI operation and reusable transaction-compatible read/select/mapper.
- Added Project layout, Structure and Unit Types routes, Project cache keyed by id,
  list links, canonical Block/Storey URL selection, responsive panes, typed Unit
  cards, empty states and not-found recovery. Units headings name both parent Block
  and Storey. New Chinese copy is machine-translated and awaits human review.
- Shared StructurePane actions/children/row-actions and UnitCard/UnitTypesTable
  action slots support the dependent management tickets without new layout seams.
- TDD: HTTP read initially returned404 and missing OpenAPI operation; now6 HTTP
  tests pass including missing/invalid token, unknown Project, envelope and actual
  HTTP list ordering using an independent database-boundary selection fake.
- New presentational components each have adjacent tests and stories. Targeted
  frontend component suite passes7 tests across4 files, including updated list links.
- Backend and frontend typechecks pass; targeted ESLint passes with zero warnings.
  Frontend Vite build passed (existing large chunk advisory only).
- Chromium browser run passes all4 detail scenarios: opening and walking Structure,
  URL/reload selection, both tabs and active links, not found, phone stacking with
  parent headings/no horizontal overflow, and empty guidance in both locales.
  Executed on isolated port5183 with temporary worktree filesystem allowance;
  temporary configs removed. Parent runs required combined checks after integration.

Coordinator integration: standards and spec reviewed, identified issues corrected (New project action, browser error intercept, observable ordering test, parent names in Units heading). Combined root lint, typecheck and unit/integration suites pass. Production frontend bundle builds. Integrated Projects/create/detail Playwright suite passes 48/48 across Chromium, Firefox and WebKit. No staging or commits.
