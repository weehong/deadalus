# 03: Open a Project's screen with its Structure and Unit Types tabs

**What to build:** Clicking a row in the Projects list opens the Project's screen: the name as the heading, the code as the kicker, a way back to the list, and two tabs, Structure and Unit Types. The Structure tab shows three panes: Blocks, Storeys of the selected Block, Units of the selected Storey. Block rows show Storey and Unit counts, Storey rows show Unit counts, Unit cards show name and Unit Type code. The selected Block and Storey live in the URL search params; with none given, the first Block and its first Storey are selected, and selecting a Block selects its first Storey. An empty pane says what to add next. On a phone the panes stack vertically with the selected Block and Storey named in the pane headings. The Unit Types tab lists code, description and Unit count as a table. A Project that no longer exists shows a "not found" state with a way back. This issue builds the read-only screen; adding, renaming and deleting arrive in 04 to 08.

Underneath: `GET /projects/:id` returns the full Project (blocks with storeys with units, each ordered by position; unitTypes ordered by code key with unitCount), registered in the OpenAPI document. A layout route `/projects/$id` renders the header and tabs; `/projects/$id/` renders Structure and `/projects/$id/unit-types` the catalogue. The Project query hook is keyed by id; the fake implements the read.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 01 (Projects list, paged and searchable)

**Status:** ready-for-agent

- [ ] The read route returns the full Project shape from the spec with every list ordered by position (Unit Types by code key), 404 for an unknown id, 401 without a token; covered at the HTTP seam
- [ ] The read route appears in the OpenAPI document
- [ ] The layout route shows kicker, heading, back link and two tab links with `aria-current`; the sidebar entry stays active
- [ ] The Structure tab renders three labelled lists with counts, selection reflected in `block` and `storey` search params, default selection rules, inverted selected rows marked `aria-current`, and empty-pane guidance, in both locales
- [ ] Below the narrow breakpoint the panes stack in one column and each heading names its parent selection
- [ ] The Unit Types tab renders a real table with column headers and an empty state
- [ ] The not-found state renders with a way back
- [ ] The e2e fake implements the read and the e2e spec covers opening a Project, selecting a Block and a Storey via the URL, both tabs, the not-found state and the phone-width layout
- [ ] New presentational components each have a story and a test beside them

## Comments
