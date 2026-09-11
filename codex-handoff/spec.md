# Spec: Projects and their Structure

Status: ready-for-agent
Created: 2026-09-11

Synthesised from the grilling interview of 2026-09-10 and 2026-09-11, and
extended on 2026-09-11 with the Unit Matrix upload once the real developer
schedules (Tampines, Jalan Tembusu, Woodleigh Lane) were read. Vocabulary
follows `CONTEXT.md` (Administrator, Session, Console, Project, Structure,
Block, Storey, Unit, Stack, Unit Matrix, Unit Type). ADR-0001 (Supabase
authentication), ADR-0002 (dedicated schema), ADR-0004 (Subcontractors are
not owned by a Project), ADR-0005 (Unit Types are a per-Project catalogue),
ADR-0006 (qualifiers are part of the Unit Type code) and ADR-0007 (SheetJS
from its own CDN) apply throughout.

## Problem Statement

An Administrator who opens Projects, the Console's first screen, sees "This
screen is not built yet." No development exists in Daedalus, so there is
nothing to hang Units on, nothing for a QR label to identify, and nothing to
which Items and Assignments can later attach. A real development has a
handful of Blocks, twenty or more Storeys each and a thousand or more Units;
a screen that only adds one row at a time would never be used.

## Solution

Projects becomes a searchable, paged list of every development. An
Administrator creates a Project with a name and a short code, then sets out
its Structure on the Project screen: three panes for Blocks, Storeys and
Units, each with Add and Add many. Add many generates names from a numeric
range or takes a pasted list, previews the result, and creates the batch in
one transaction; Units can be created into several Storeys of a Block at
once with an optional Unit Type. A Unit Types tab holds the Project's
catalogue of codes and descriptions. Every level can be renamed and deleted;
deletion cascades after a confirmation that names what goes.

A Project that has no Blocks yet can instead be set out from the developer's
own Unit Matrix workbook. The server detects each Block's grid in the
uploaded `.xls` or `.xlsx` file, the Administrator reviews and corrects the
result in an editable preview, and one commit creates every Block, Storey,
Unit and missing Unit Type in a single transaction.

## User Stories

1. As an Administrator, I want Projects in the sidebar to open a real list instead of a placeholder, so that the developments I manage live in Daedalus.
2. As an Administrator, I want the Projects list to show each Project's code, name, and its Block, Storey and Unit counts, so that I can see the size of each development at a glance.
3. As an Administrator, I want the Projects list sorted by name, paged, and searchable by name or code, so that a long list stays navigable.
4. As an Administrator, I want an empty list to say so and invite me to create the first Project, and a search with no matches to say nothing matched, so that an empty table is not mistaken for a failure.
5. As an Administrator, I want loading and error-with-retry states on the Projects list, so that a slow or failed fetch is never a blank screen.
6. As an Administrator, I want a "New project" action in the list's header row that opens a form asking for a name and a code, so that creating a development starts where I look for one.
7. As an Administrator, I want both fields required, with field-level messages, and the code upper-cased and limited to letters, digits and hyphens, so that codes read consistently.
8. As an Administrator, I want to be told when a Project with that name or that code already exists, on the field concerned, so that I open the existing one instead of duplicating it.
9. As an Administrator, I want a successful creation to land on the new Project's screen, so that I can start setting out its Structure.
10. As an Administrator, I want a Project screen headed by the Project's name with its code as the kicker, a way back to the list, and two tabs, Structure and Unit Types, so that I always know where I am.
11. As an Administrator, I want to rename a Project or change its code from its screen under the same uniqueness rules, so that a typo is fixable.
12. As an Administrator, I want to delete a Project after a confirmation naming its Block, Storey and Unit counts, so that I cannot delete a whole development by accident.
13. As an Administrator, I want the Structure tab to show three panes, Blocks, Storeys of the selected Block, and Units of the selected Storey, so that I can walk a development the way it is built.
14. As an Administrator, I want each Block row to show its Storey and Unit counts and each Storey row its Unit count, so that I can see what is set out without opening it.
15. As an Administrator, I want the selected Block and Storey reflected in the URL, so that a link opens the same view.
16. As an Administrator, I want an empty pane to say what to add next, so that a new Project guides me through the first Block, Storey and Unit.
17. As an Administrator, I want an Add action on every pane that creates one named row, so that a single addition is quick.
18. As an Administrator, I want an Add many action on every pane that generates names from a prefix, a start number, an end number, a zero-pad width and a suffix, so that "01 to 20" takes seconds, not minutes.
19. As an Administrator, I want the same Add many form to accept a pasted list, one name per line, so that irregular names like G, M, 2A are as easy as a range.
20. As an Administrator, I want the Add many form to preview every name it will create, with the total count, before I submit, so that I can see a mistake before it becomes 200 rows.
21. As an Administrator, I want the preview to mark names that already exist under that parent and names repeated in my list, and the submit to be refused until I fix them, so that nothing half-creates.
22. As an Administrator, I want Add many Units to let me tick which Storeys of the Block receive the batch, with the selected Storey pre-ticked and a select-all, so that one action fills a whole tower.
23. As an Administrator, I want Add many Units to take an optional Unit Type applied to every Unit in the batch, so that typing is done at creation rather than one Unit at a time.
24. As an Administrator, I want a batch that clashes on the server to be refused entirely, with the clashing names listed, so that a concurrent edit never leaves half a batch behind.
25. As an Administrator, I want Blocks, Storeys and Units listed in the order I created them, so that G, 01, 02 stay in building order rather than alphabetical order.
26. As an Administrator, I want to rename a Block, Storey or Unit in place under the sibling-uniqueness rule, so that a typo is fixable without recreating children.
27. As an Administrator, I want a Unit card to show its name and Unit Type code, and to let me change its Unit Type inline, so that typing is correctable per Unit.
28. As an Administrator, I want to delete a Block or Storey after a confirmation naming how many Storeys and Units go with it, so that cascading deletion is never a surprise.
29. As an Administrator, I want to delete a Unit after a confirmation, so that a mistaken Unit can go.
30. As an Administrator, I want the Unit Types tab to list the Project's Unit Types by code with their descriptions and how many Units use each, so that the unit mix is readable.
31. As an Administrator, I want to add and edit a Unit Type with a required code and an optional description, the code unique within the Project however it is spaced or cased, so that the catalogue matches the developer's schedule.
32. As an Administrator, I want deleting a Unit Type that Units still use to be refused with the count, so that no Unit silently loses its type.
33. As an Administrator, I want every change to appear on the Project screen and in the list immediately after it succeeds, so that what I see is the server's copy.
34. As an Administrator, I want Projects marked as the active sidebar entry on the list, the form and every Project screen, so that I always know where I am.
35. As an Administrator, I want a link to a Project that no longer exists to show a "not found" state with a way back, so that a stale bookmark is not a crash.
36. As an Administrator using Chinese, I want every screen, message and validation error translated, so that the feature reads in my language.
37. As an Administrator on a phone, I want the three panes to stack vertically with the selected Block and Storey named in each pane's heading, so that nothing scrolls sideways.
38. As a keyboard user, I want every pane row, action and form reachable and operable by keyboard, and focus to move into each confirmation dialog and back to its trigger, so that I never need a pointer.
39. As a screen-reader user, I want the Projects list and the Unit Types list rendered as real tables, the panes as labelled lists, and validation errors associated with their fields, so that I can navigate and hear what is wrong.
40. As a visitor without a Session, I want every Project screen to send me to Sign in, so that nothing is reachable by URL.
41. As a developer, I want every Project API route to refuse a request without a verified token, so that the Structure is never exposed anonymously.
42. As a developer, I want Blocks, Storeys, Units and Unit Types reachable only through their Project's routes, and a child of another Project to be a 404, so that the Project is the ownership boundary.
43. As a developer, I want every batch created in one transaction with positions assigned in order, so that a batch is all-or-nothing and order is deterministic.
44. As a developer, I want uniqueness enforced by database constraints and translated into 409s with stable codes, so that the client shows the right message without parsing text.
45. As a developer, I want every write to return the Project's full Structure, so that the client has one shape to cache and invalidate.
46. As a developer, I want the routes documented in the OpenAPI document, so that the contract is visible alongside the existing routes.
47. As a developer, I want the API contract asserted at the HTTP seam with Prisma mocked and a signed test token, and the browser flow covered end to end against a browser-edge fake, so that the feature is verified without a live database or account.
48. As a developer, I want each new presentational component to have a story and a test beside it, so that the convention holds.
49. As a developer, I want the placeholder "not built yet" and its translation key removed once nothing uses them, and SPEC.md and README to describe Projects as built, so that nothing false remains.
50. As an Administrator, I want an "Upload Unit Matrix" action on the Structure tab of a Project that has no Blocks, so that a developer's schedule sets out a whole development without retyping.
51. As an Administrator, I want to upload the developer's own `.xls` or `.xlsx` workbook without reshaping it first, so that the file I was sent is the file I use.
52. As an Administrator, I want the preview to show each Block the parser found, with its name, Storey count, Unit count and stack range, so that I can see at a glance whether the file was read correctly.
53. As an Administrator, I want to choose which sheet of the workbook is read, defaulting to the first sheet with a grid, so that a workbook holding two versions of the grid imports the right one.
54. As an Administrator, I want to rename or untick any detected Block before commit, so that a header like "1 TAMPINES STREET 62 (TOWER 3)" becomes what we call it and a mis-detected table can be dropped.
55. As an Administrator, I want each Block's matrix shown as Storeys by Stacks with the Unit Type code in each cell, and to change or clear a cell, rename a Storey, and add or remove a Storey or a Stack, so that a wrong cell is fixed before it becomes a Unit.
56. As an Administrator, I want the preview to list each Block's warnings and the Unit Type codes that will be created, so that nothing is created that I did not see.
57. As an Administrator, I want commit refused with the list of hard errors while any remain, and refused when the Project already has Blocks, so that nothing half-imports.
58. As an Administrator, I want the commit to create every Block, Storey, Unit and new Unit Type in one go and then show the Structure tab with a summary of the counts, so that I know what was made.
59. As an Administrator, I want a floor the schedule shows with no Units, such as a void deck or a basement, left out, and a cell that spans two stacks to become one Unit, so that the Structure holds what will be tracked and the counts match the schedule.
60. As an Administrator, I want a file the parser cannot read at all to be refused with the reason, so that I know to fix the sheet rather than retry.
61. As a developer, I want the parser covered by synthesised workbooks that reproduce each real quirk, so that a client's file never enters the repository.
62. As a developer, I want the parse and commit routes documented in the OpenAPI document and covered at the HTTP seam, so that the contract is visible.

## Implementation Decisions

### Domain model

- Five persisted concepts in the dedicated `daedalus2` schema per ADR-0002:
  **Project**, **Block**, **Storey**, **Unit**, **UnitType**. No reference
  from any of them to Subcontractor (ADR-0004).
- **Project** carries an opaque id, the display name as entered (trimmed), a
  normalised name key (lower-cased, trimmed, internal whitespace collapsed)
  that carries a unique constraint, the code as stored (trimmed,
  upper-cased, 2 to 12 characters of `A-Z`, `0-9` and `-`) carrying its own
  unique constraint, and timestamps. Name key derivation reuses the existing
  Subcontractor name-key function, moved to a shared `name-key` module.
- **Block** carries an opaque id, the Project id, name, name key, an integer
  position and timestamps. Unique on (projectId, nameKey). The Project
  reference cascades deletion.
- **Storey** carries an opaque id, the Block id, name, name key, position
  and timestamps. Unique on (blockId, nameKey). Cascades from Block. Every
  Storey has exactly one Block; there are no Project-level Storeys.
- **Unit** carries an opaque id, the Storey id, an optional Unit Type id,
  name, name key, position and timestamps. Unique on (storeyId, nameKey).
  Cascades from Storey. The Unit Type reference is `onDelete: Restrict`; the
  service refuses the delete before the database would.
- **UnitType** carries an opaque id, the Project id, the code as entered
  (trimmed, 1 to 40 characters), a code key (upper-cased with all whitespace
  removed, per ADR-0006) carrying a unique constraint on (projectId,
  codeKey), an optional description (trimmed, 1 to 120 characters when
  given) and timestamps. Cascades from Project. The count of Units of a type
  is derived, never stored. A qualifier such as `(p)`, `(M)`, `(d)` or `-PH`
  is part of the code; nothing parses it.
- **Position** is assigned by the service as `max(position) + 1` among
  siblings at creation time, inside the batch's transaction, in the order
  the names were given. Lists order by position then id. There is no reorder
  operation.
- Names at every level are free text, trimmed, 1 to 60 characters. Nothing
  parses a name; "A-03-04" is just a name.
- Invariants: no move. A Block, Storey or Unit is never re-parented; PATCH
  accepts a name (and, for Unit, a Unit Type), nothing else.

### Batches

- A batch is an array of names, 1 to 500 entries, each trimmed and
  non-empty, with no two equal after name-key normalisation; a repeated name
  is a 400 on the `names` field, found by validation before any query.
- A batch is one transaction: the parent is loaded and checked for
  ownership, positions are computed, all rows are inserted. A unique
  violation, or a pre-check finding existing name keys, rolls the whole
  batch back and returns 409 with the level's `NAME_TAKEN` code and
  `details: { names: [...] }` listing every clashing name as given. The
  pre-check exists to list all clashes at once; the constraint remains the
  authority.
- The single Add action sends a batch of one; there is no separate
  single-create route.
- A Unit batch targets 1 to 200 Storeys of one Block; the product of
  Storeys and names may not exceed 2000, enforced by validation. Uniqueness
  is per Storey, so the same names go into every ticked Storey. The optional
  Unit Type id must belong to the Project or the request is a 404.

### Unit Matrix upload

- **Dependencies**: SheetJS Community Edition 0.20.3 as a pinned tarball
  from `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (ADR-0007), and
  `multer` with memory storage for the one multipart route. The browser
  never parses a workbook.
- **Parse route**: `POST /projects/:id/unit-matrix/parse`, multipart with
  one field `file`, at most 10 MB, extension `.xls` or `.xlsx`. 404 for an
  unknown Project. 400 `UNIT_MATRIX_UNREADABLE` when SheetJS cannot open the
  buffer; 400 `BAD_REQUEST` for a missing file, a wrong extension or an
  oversize file (multer errors are translated in the controller). 200 with
  `{ data: { sheets: [{ name, blocks: [...], warnings: [...] }] } }`, every
  sheet of the workbook parsed, so the client can offer a sheet picker. A
  sheet with no detected Block has an empty `blocks` array. Nothing is
  stored; the route is a pure function of the file.
- **Block shape** in the parse response: `{ name, stacks: [string], storeys:
  [{ name, cells: [string | null] }], unitCount, warnings: [{ code, message
  }] }`. `stacks` are the column headers as strings; each Storey's `cells`
  is parallel to `stacks`; a `null` cell is no Unit. Storeys are listed
  lowest first.
- **Detection**, per sheet, in order: (1) a Block header is a non-empty text
  cell spanning two or more columns (a merged range, or a lone text cell
  with empty neighbours) that is followed within four rows by a row of
  consecutive integers under those same columns; the integers are the
  Stacks and their columns the Block's stack columns. (2) The floor column
  is the nearest column to the left of the first stack column that, in the
  rows below the stack row, holds a run of non-empty labels; two Blocks side
  by side may share one floor column. (3) Rows are floors while the floor
  column is labelled; the first row with an empty floor label ends the
  Block, so schematic and count rows below are never read. (4) A cell's
  value is its trimmed string; cached formula values are used, never
  formulas. (5) A merged range inside the grid is one cell at its top-left
  position, so a `PH` merged over two stacks yields one Unit named by the
  first stack and `null` under the second. (6) A floor whose cells are all
  `null` is dropped with a warning naming the label. (7) Numeric floor
  labels are padded to two digits; other labels are kept as written. (8)
  Storeys are ordered by reversed row order, so the sheet's top-down grid
  comes out lowest first without parsing labels. (9) If no integer row
  follows a header, the header is not a Block. (10) Block names are the
  header text, trimmed, with internal whitespace collapsed.
- **Warnings** (codes are stable, messages translated by the client): a
  floor dropped for holding no Units; stack numbers not consecutive; a row
  inside the Block whose floor label repeats an earlier one (the later row
  is dropped); a Block with no Units at all (kept, so the Administrator can
  untick it).
- **Commit route**: `POST /projects/:id/structure { blocks: [{ name,
  storeys: [{ name, units: [{ name, unitTypeCode? }] }] }] }`. The client
  converts the matrix to this shape: one Unit per non-null cell, named by
  its Stack, with the cell's code; a Storey left with no Units after editing
  is omitted and the summary says so. Validation: 1 to 50 Blocks, 1 to 60
  characters per name, codes 1 to 40 characters, at most 10,000 Units in
  total, and no duplicate name key among sibling Blocks, sibling Storeys or
  sibling Units (a 400 listing the duplicates under `details`). 404 for an
  unknown Project. 409 `PROJECT_HAS_BLOCKS` with `details: { blockCount }`
  when the Project already has any Block. On success, one transaction
  creates every Unit Type whose code key is not yet in the Project (code
  as first seen, no description), then every Block, Storey and Unit with
  positions in array order, and returns 201 with the full Project. Existing
  Unit Types are reused by code key.
- **Hard errors** that block the commit are found client-side against the
  same rules and reported next to the offending row or cell; the commit
  route is the authority and repeats the checks.
- Both routes sit behind the router-level token check and are registered
  in the OpenAPI document. Parsing a workbook of a Project that already has
  Blocks succeeds; only the commit refuses, and the client already knows
  the count from the loaded Project.

### API contract

All routes live under the existing `/api/v1` prefix behind the router-level
token check. Success uses the `{ data }` envelope, paged lists add `meta`,
errors use `{ error: { code, message, details } }`.

- **List Projects**: `GET /projects?q=&page=&pageSize=`. `q` matches a
  case-insensitive substring of name or code. Sorted by name key. Rows
  carry id, code, name, blockCount, storeyCount, unitCount. Paging as the
  Directory: `page` from 1, `pageSize` default 20 capped at 100, `meta`
  block.
- **Create Project**: `POST /projects { name, code }`. 201 with the full
  Project. 400 on validation; 409 `PROJECT_NAME_TAKEN` or
  `PROJECT_CODE_TAKEN`.
- **Read Project**: `GET /projects/:id`. Returns the full Project:
  `{ id, code, name, blocks: [{ id, name, position, storeys: [{ id, name,
  position, units: [{ id, name, position, unitTypeId }] }] }], unitTypes:
  [{ id, code, description, unitCount }] }`, each list ordered by position
  (Unit Types by code key). One read serves the whole Project screen. 404
  otherwise.
- **Edit Project**: `PATCH /projects/:id { name?, code? }`, at least one.
  Same 409s as creation. Returns the full Project.
- **Delete Project**: `DELETE /projects/:id`. Cascades. 204. 404 otherwise.
- **Add Blocks**: `POST /projects/:id/blocks { names }`. 201 with the full
  Project. 409 `BLOCK_NAME_TAKEN` with `details.names`.
- **Rename Block**: `PATCH /projects/:id/blocks/:blockId { name }`. 409 as
  above. **Delete Block**: `DELETE /projects/:id/blocks/:blockId`, 204.
- **Add Storeys**: `POST /projects/:id/blocks/:blockId/storeys { names }`.
  201 with the full Project. 409 `STOREY_NAME_TAKEN`.
- **Rename Storey**: `PATCH /projects/:id/storeys/:storeyId { name }`.
  **Delete Storey**: `DELETE /projects/:id/storeys/:storeyId`, 204.
- **Add Units**: `POST /projects/:id/blocks/:blockId/units { storeyIds,
  names, unitTypeId? }`. Every Storey must belong to that Block or the
  request is a 404. 201 with the full Project. 409 `UNIT_NAME_TAKEN` with
  `details.names` (the clashing names, once each, regardless of Storey).
- **Edit Unit**: `PATCH /projects/:id/units/:unitId { name?, unitTypeId?
  }`, at least one; `unitTypeId: null` clears the type. **Delete Unit**:
  `DELETE /projects/:id/units/:unitId`, 204.
- **Add Unit Type**: `POST /projects/:id/unit-types { code, description }`.
  201 with the full Project. 409 `UNIT_TYPE_CODE_TAKEN`.
- **Edit Unit Type**: `PATCH /projects/:id/unit-types/:unitTypeId { code?,
  description? }`. **Delete Unit Type**: `DELETE
  /projects/:id/unit-types/:unitTypeId`; 409 `UNIT_TYPE_IN_USE` with
  `details: { unitCount }` while any Unit references it; 204 otherwise.
- Every child route resolves the child through the Project id in the path;
  a child of another Project is a 404, never a hit. Blocks are addressed
  under the Project, Storeys and Units directly under the Project by their
  own id (the Project is the ownership boundary; the full path through
  Block and Storey adds nothing the id does not).
- Every write that is not a delete returns the full Project, so the client
  caches one shape per Project id.
- All routes are registered in the OpenAPI document with their schemas.

### Server modules

- One zod schema module for Project, Structure and Unit Type request shapes,
  including the paging query, the batch shape (with the duplicate refine)
  and the code transform (trim, upper-case, pattern).
- One service module owning the five concepts, exposing list, create, get,
  edit, delete for Project; addBlocks, renameBlock, deleteBlock; addStoreys,
  renameStorey, deleteStorey; addUnits, editUnit, deleteUnit; addUnitType,
  editUnitType, deleteUnitType. The full-Project select and its transport
  mapping live here. Clash detection shares one helper across the three
  levels.
- One controller module and one router module, following the existing
  route, controller, service split. Mounted at `/projects` in the v1 router.
- The Subcontractor name-key helper moves to `@/lib/name-key.js` and is
  reused; the Subcontractor import is updated.
- Dev seed adds one Project with a few Blocks, Storeys and Units and two or
  three Unit Types, with fixed ids so it is idempotent.

### Frontend

- A new `features/projects` module holding the API client functions over
  the existing fetch helper, TanStack Query hooks with a query key family
  keyed by the list parameters and by Project id, and the screens.
  Mutations invalidate the list and the affected Project's query; the
  returned full Project is written into the cache directly so the screen
  updates without a refetch.
- Routes under the guarded Console layout: `/projects` (the list),
  `/projects/new` (the form), `/projects/$id` (a layout with the header and
  tabs), `/projects/$id/` (Structure) and `/projects/$id/unit-types`. The
  existing `projects.ts` route file is replaced by `projects.index.ts`.
  `new` is a fixed segment and takes precedence over `$id`. The sidebar
  entry stays active for all of them by prefix matching.
- The Structure tab keeps the selected Block and Storey in search params
  (`block`, `storey`). With none selected, the first Block and its first
  Storey are selected. Selecting a Block selects its first Storey.
- The list reuses the Directory's table, paging and debounced search
  patterns (TanStack Table, manual pagination). The form reuses
  react-hook-form with a zod resolver and the Field and Input primitives;
  409 codes map to field errors on name or code.
- The Project layout uses PageHeader (kicker is the code, heading the name,
  actions slot holding Edit and Delete). Edit opens an inline form in place
  of the heading, as Rename does for a Subcontractor. Tabs are links with
  `aria-current`.
- Panes are lists in a three-column grid that collapses to a single column
  below the existing narrow breakpoint. Each pane has a heading naming its
  parent selection, an Add control (single-name inline form) and an Add
  many control. Rows are buttons showing name and counts; the selected row
  is visually inverted and marked `aria-current`. Row actions are Rename
  (inline) and Delete (dialog). Unit cards add a Unit Type select.
- One shared `BatchNamesForm` component serves all three levels: a mode
  toggle (Range or List), the range fields (prefix, from, to, pad, suffix)
  or a textarea, the live preview list with count, per-name markers for
  existing and repeated names (computed client-side against the loaded
  Project), and a submit disabled while any marker shows. The Unit variant
  adds a Storey checkbox list with select-all and a Unit Type select. The
  name generator is a pure function with its own unit test.
- Delete confirmations reuse the existing Dialog primitive; the copy names
  the row and its descendant counts.
- The Unit Types tab is a table (code, description, Units) with an inline
  row form for add and edit (description optional) and a Delete action that
  shows the in-use refusal inline.
- **Upload screen** at `/projects/$id/upload` under the Project layout,
  reached from an "Upload Unit Matrix" action on the Structure tab that is
  disabled with a hint while the Project has Blocks, and offered on the
  empty Blocks pane. The screen has: a file input (`.xls`, `.xlsx`) that
  calls the parse route and shows a busy state; a sheet select listing every
  sheet with its Block count, defaulting to the first with a Block; a Block
  accordion, one open at a time, each header showing an editable name, a
  tick to include, Storey and Unit counts, the stack range and a warning
  count; inside, the `UnitMatrixEditor`: a table with Storey labels as row
  headers (editable), Stack numbers as column headers (not editable), and
  one text input per cell; row and column actions to insert a Storey above
  or below (asking its name) and a Stack left or right (asking its number),
  and to remove either; a list of the Unit Type codes that will be created;
  a list of hard errors that disables Commit; and Commit, which sends the
  converted Structure, then navigates to the Structure tab with a summary
  line of the counts created. A parse failure shows the reason inline. The
  matrix state is client-only until Commit; leaving the screen discards it
  after a confirmation.
- The editor is a presentational component over a plain matrix value with
  `onChange`; the matrix-to-Structure conversion and the hard-error
  detection are pure functions with their own unit tests.
- New copy is added to both locale files; zh-CN strings are
  machine-translated and flagged. The `console.notBuilt` key is removed once
  no screen uses it.

## Testing Decisions

A good test drives the system from outside a seam and asserts what an
Administrator or a client would observe: status codes, envelopes, rendered
text and roles. Tests do not reach into services, stores or component
internals, and do not assert on how a query was built.

### Seam 1: the API over HTTP

- Supertest against the app factory with Prisma mocked at the singleton,
  including the transaction wrapper, and requests carrying a token signed
  by the test key, as the Subcontractor route tests do.
- Covers: 401 on every route; list paging, search and `meta`; Project
  creation with code normalisation and both 409s; the full-Project read
  shape and ordering; edit and delete; each batch route's happy path,
  duplicate-in-batch 400, size caps, clash 409 with `details.names`, and
  the parent-of-another-Project 404; the Unit batch's Storey ownership and
  Unit Type ownership checks; Unit Type CRUD and the in-use 409; the
  OpenAPI document listing every path.
- Pure functions unit-tested outside the seam: the name-key helper (moved),
  the code normaliser, the code-key helper, and the batch clash helper.
- The parser is unit-tested against **synthesised workbooks** built in the
  test with SheetJS's writer, one per quirk, with invented names: four
  Blocks in two bands sharing a floor column; twelve Blocks in three bands
  with an empty floor 1 and B1 and B2 rows, schematic and count rows below,
  and top-aligned versus bottom-aligned bands; glued `(p) (M)` and spaced
  `(p)`/`(d)` qualifiers with trailing spaces; a cell merged across two
  stacks; floor labels as formulas with cached values; a partial top floor
  with blank cells mid-row; stacks starting above floor 1; a sheet with no
  grid; a workbook that is not a workbook. Each asserts the Block shape,
  the Storey order and names, the cells and the warnings. The real client
  files are run by hand once as a check and are never committed.
- The parse route is covered at the HTTP seam with supertest `attach`,
  asserting the envelope, the 400s for a missing, oversize or wrong-type
  file, and the 404. The commit route is covered with Prisma mocked: the
  happy path's transaction shape and 201, every 400, the `PROJECT_HAS_BLOCKS`
  409, the reuse of an existing Unit Type by code key, and the 404.

### Seam 2: the browser through the Console

- Playwright signs in through the intercepted provider. A browser-edge
  fake for `/api/v1/projects*` implements the contract above in memory,
  including paging, search, positions, every 409 and the in-use rule, in
  the style of the existing Subcontractor fake.
- The browser-edge fake implements the parse route by returning a canned
  parsed result for any uploaded file (with sheets, warnings and a merged
  cell) and the commit route by creating the Structure in memory with the
  409. Playwright uploads a tiny buffer with `setInputFiles`.
- Covers for the upload: the action disabled while Blocks exist; upload,
  sheet switch, Block rename and untick; editing a cell, clearing a cell,
  renaming a Storey, inserting and removing a Storey and a Stack; a
  duplicate name shown as a hard error disabling Commit; the new Unit Type
  list; Commit landing on the Structure tab with the summary; a parse
  failure shown inline.
- Covers: the placeholder is gone and the list renders; search and paging;
  creating a Project lands on its screen; field errors and both taken
  codes; the panes with selection reflected in the URL; adding one Block;
  Add many with a range and with a pasted list, the preview, a marked
  clash blocking submit, and a server clash message; Add many Units across
  ticked Storeys with a Unit Type; rename at each level; delete dialogs
  with counts and focus handling; the Unit Types tab add, edit, in-use
  refusal and delete; the not-found state; the active sidebar entry; the
  unauthenticated redirect; the stacked layout at phone width.
- The name generator's unit test covers padding, prefix and suffix, a
  reversed range, and the list mode's trimming and blank-line dropping.

### Component tests

- Each new presentational component (ProjectsTable, ProjectForm, the pane
  list, BatchNamesForm, the Unit card, the Unit Types table, the delete
  dialogs, the upload form, the Block accordion, UnitMatrixEditor) gets a
  story and a testing-library test beside it, asserting roles, labels and
  callbacks with plain props.

## Out of Scope

- Uploading into a Project that already has Blocks: merging a revised
  schedule or replacing the Structure waits until Items exist and their
  rules are known.
- Reading anything but the grids from a workbook: legends, per-tower
  counts and totals are not parsed, so Unit Type descriptions are entered
  in the Unit Types tab.
- A blank Unit Matrix opened without a file as a fourth entry path.
- Renumbering a Stack in the preview (a column header is fixed once
  detected; a new column asks for its number).
- CSV or PDF schedules, and parsing in the browser.
- Items, tasks, progress, Assignments, QR labels and tokens, and a Unit
  detail screen.
- Moving a Block, Storey or Unit to another parent; reordering.
- Project location, status, progress roll-ups and the prototype's card
  grid.
- Project-level (shared) Storeys.
- A global Unit Type catalogue or copying Unit Types between Projects
  (ADR-0005).
- Multi-select bulk edit of existing Units.
- Soft delete, archiving or audit history.
- Refusing deletion while Items or Assignments exist; that check arrives
  with those features.

## Further Notes

- The full-Project read returns every Unit of the Project in one payload.
  At the largest development discussed (about 1200 Units) that is on the
  order of 100 KB, acceptable for one screen. If Projects grow past a few
  thousand Units, the Units of a Storey become their own paged read; the
  route shape allows it without moving anything else.
- The `meta` block on the Projects list reuses the Directory's shape, as
  the Subcontractor spec anticipated.
- `onDelete: Restrict` on the Unit's Unit Type reference is the database's
  backstop; the service checks first so the 409 carries the count.
- Playwright cannot run on the development host until its system
  dependencies are installed, so seam 2 specs are written to the contract
  and verified in an environment where Playwright runs.
- The three real schedules read on 2026-09-11 drove the detection rules:
  Tampines (12 towers in 3 bands, 1193 Units, floor 1 and basements empty,
  `(p)` glued and `(M)` mirrored, schematic and count rows), Jalan Tembusu
  (4 Blocks in 2 bands sharing a floor column, 638 Units, formula floor
  labels, `PH` merged over two stacks, stacks starting at floor 2 or 3, one
  Block a storey taller) and Woodleigh Lane (6 Blocks of 14 or 15 storeys,
  `-PH` on every top floor, from a PDF chart only). Stack numbers are
  project-wide in every one of them, which is why a Unit's name is the
  stack number as printed (01 to 114) and never renumbered per Block.
- The Unit Type catalogue of a Tampines-sized Project holds about 80 codes
  under ADR-0006; the Unit Types tab is a plain table and stays usable at
  that size, but paging it is not needed yet.
