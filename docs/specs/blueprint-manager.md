# Spec: Daedalus Ops Blueprint Manager

## Problem Statement

An Administrator responsible for a Site has no way to describe the building itself. The
console can say who is signed in and can move between its sections, but it holds no record
of the storeys a Site is made of, the floor plans that describe each storey, the units a
floor plan is divided into, or the equipment installed in those units. Without that
structure, nothing else about the Site can be located: an asset has no "where", a work
order has no room to point at, and a subcontractor's responsibilities cannot be written
down against the part of the building they cover.

The architect's drawings that carry all of this information exist only as files on
someone's machine. There is nowhere in the console to put them, nothing that remembers
which drawing describes which floor, and no way for a second Administrator to see them.

A static prototype sketches the answer — four screens under a "Blueprints" heading — but it
is inline-styled, runs on fixed fictional data, names the product "Meridian Ops", and offers
several controls that lead nowhere.

## Solution

Build the Blueprint Manager: a section of the console, reached from the sidebar, in which an
Administrator records and maintains the structure of a Site and what is installed in it.

Four screens. **Building structure** shows the Site as a tree — Storey, Floor plan, Unit —
beside a detail card for whatever is selected and a table of its children, with create, edit
and delete for every level. **Unit** shows one unit in full: its fields, the installations in
it (with create, edit and delete), and the drawing it was taken from. **Subcontractors** lets
the Administrator keep a list of subcontractors and tick, unit by unit, which scope items
each one is in charge of, with a scope sheet and Site-wide coverage figures beside the list.
**Upload drawings** lets the Administrator drop or pick any number of drawing files, watch
them upload with real progress, and see each one recorded against the Site.

Everything is stored in the project's database and visible to every Administrator; nothing
is invented. Every control on screen does something real; the prototype's controls whose
backing features do not yet exist are left out until they do. The section works in English
and Simplified Chinese and is operable by keyboard and screen reader.

## User Stories

### Reaching the section

1. As an Administrator, I want a "Blueprints" entry in the sidebar, so that I can find the
   building structure from anywhere in the console.
2. As an Administrator, I want Blueprints to open into its four screens — Upload drawings,
   Building structure, Units, Subcontractors — listed beneath it, so that I can move between
   them directly.
3. As an Administrator, I want those four sub-entries shown only while I am inside
   Blueprints, so that the sidebar stays short elsewhere.
4. As an Administrator, I want the Blueprints entry itself to take me to the structure
   screen, so that the heading is not a dead row.
5. As an Administrator, I want the current sub-screen marked in the sidebar, so that I know
   which of the four I am on.
6. As an Administrator, I want each Blueprint screen to carry a page heading with the Site's
   name and that screen's actions, so that I know what building I am editing and what I can
   do here.
7. As an Administrator, I want every Blueprint screen to be reachable by URL, so that I can
   bookmark a unit or share a link to the structure with a colleague.
8. As an Administrator on a narrow window, I want the dense screens to stack into one
   column, so that I can still read them on a tablet.

### Building structure

9. As an Administrator, I want to see the Site's storeys, the floor plans under each, and
   the units under each floor plan as a tree, so that the building's hierarchy is visible at
   a glance.
10. As an Administrator, I want to expand and collapse storeys and floor plans in the tree,
    so that a large building stays navigable.
11. As an Administrator, I want each tree row to show its kind, its name and a count of what
    is inside it, so that I can tell a storey with one plan from one with three.
12. As an Administrator, I want to select a storey or floor plan in the tree and see its
    details beside it, so that I can review it without leaving the screen.
13. As an Administrator, I want the selected item remembered in the URL, so that reloading or
    sharing the link shows the same selection.
14. As an Administrator arriving with no selection, I want the first storey selected, so
    that the screen is never blank.
15. As an Administrator, I want the storey detail to show its number, level from, level to,
    derived storey height, number of floor plans and units, structural note and last edited
    time, so that I see the storey as the drawings describe it.
16. As an Administrator, I want the floor plan detail to show its code, slab level, storey
    height, gross area, unit count, source drawing, structural grid and last edited time, so
    that I can check it against the sheet.
17. As an Administrator with a storey selected, I want a table of its floor plans (code,
    name, slab level, gross area, unit count, source drawing), so that I can compare them.
18. As an Administrator with a floor plan selected, I want a table of its units (code, room
    tags, area, entry door, installation count, status), so that I can see the floor's
    make-up.
19. As an Administrator, I want "Open" on a floor plan row to select it, and "Open" on a unit
    row to go to the unit screen, so that I can drill down from the table.
20. As an Administrator, I want a "New storey" action on the page heading, so that adding to
    the top of the tree is always one click away.
21. As an Administrator, I want "Add floor plan" when a storey is selected and "Add unit" when
    a floor plan is selected, so that the create action fits what I am looking at.
22. As an Administrator, I want "+" on a storey or floor plan row in the tree to add a child
    to that row, so that I can build out the tree in place.
23. As an Administrator, I want to create a storey by giving its name, number, level from,
    level to and a structural note, so that the height zone is recorded.
24. As an Administrator, I want to create a floor plan by giving its name, code, parent
    storey, slab level, gross area and structural grid, so that a sheet has a home.
25. As an Administrator, I want to create a unit by giving its code, floor plan, usable area,
    entry door, room tags and boundary note, so that a tenancy is recorded.
26. As an Administrator, I want to edit any storey, floor plan or unit in the same dialog I
    created it with, pre-filled, so that a correction is quick and familiar.
27. As an Administrator, I want to delete a storey, floor plan or unit after confirming by
    name, so that I do not remove the wrong thing.
28. As an Administrator, I want deletion refused, with the reason shown, when the item still
    contains floor plans, units or installations, so that I cannot erase part of a building
    by accident.
29. As an Administrator, I want to be told when a storey number, floor plan code or unit code
    is already used in this Site, so that codes stay unique.
30. As an Administrator, I want level to rejected when it is not above level from, and
    negative areas and heights rejected, so that the structure cannot hold nonsense.
31. As an Administrator, I want field problems shown against the field they belong to, so
    that I know what to fix.
32. As an Administrator, I want the tree, detail and tables to refresh after a create, edit or
    delete, so that what I see is what is stored.
33. As an Administrator, I want an empty Site to show a clear "no storeys yet" state with the
    create action, so that the first step is obvious.

### Units

34. As an Administrator, I want a Units screen listing the units of a floor plan with a plan
    selector, so that I can reach any unit without walking the tree.
35. As an Administrator, I want a unit screen showing the unit's code, usable area, room tag
    count, ceiling height, entry door, boundary type, tenancy status and grid reference, so
    that I see the unit in full.
36. As an Administrator, I want a breadcrumb — Structure / storey / floor plan / unit — with
    links back into the structure screen at the right selection, so that I keep my place.
37. As an Administrator, I want "Edit unit" on the unit screen, so that I can correct it
    where I am reading it.
38. As an Administrator, I want a table of the unit's installations (equipment and model,
    asset tag, location in unit, installed date, state), so that I know what is in the unit.
39. As an Administrator, I want the installation summary ("4 installed · 1 scheduled") above
    the table, so that I have the count without counting.
40. As an Administrator, I want to record a new installation by giving equipment, model, asset
    tag, location, installed date and state, so that equipment has a place.
41. As an Administrator, I want to edit and delete an installation, so that the record stays
    true as equipment changes.
42. As an Administrator, I want an asset tag rejected when it is already used in this Site, so
    that tags stay unique.
43. As an Administrator, I want a "Sheet reference" card naming the drawing the floor plan was
    taken from with an "Open drawing" action, so that I can check the source.
44. As an Administrator, I want that card to say plainly "No drawing linked" when there is
    none, rather than a dead button, so that I am not misled.
45. As an Administrator, I want a unit with no installations to show a clear empty state with
    the create action, so that recording the first one is obvious.

### Subcontractors

46. As an Administrator, I want a list of the Site's subcontractors with name, trade and a
    count of items in their scope, so that I can see who does what.
47. As an Administrator, I want to add a subcontractor by giving company name, trade, contact
    person, phone, email, contract reference and default scope items, so that they exist
    before I assign work.
48. As an Administrator, I want to edit and delete a subcontractor, so that the list stays
    current.
49. As an Administrator, I want selecting a subcontractor to show the building as a checklist
    — storey, floor, unit, then scope items A to F — so that I can assign by walking the
    building.
50. As an Administrator, I want to tick a single scope item on a unit, so that assignment is
    precise.
51. As an Administrator, I want to tick a unit to assign all its scope items at once, and
    see a partial mark when only some are ticked, so that bulk assignment is fast and honest.
52. As an Administrator, I want the first tick on a unit to pre-tick the subcontractor's
    default scope items, so that their usual trade is one click.
53. As an Administrator, I want to see, against an item, which other subcontractors already
    hold it, so that double assignment is visible.
54. As an Administrator, I want "Expand all" and "Clear scope", so that I can review the
    whole building or start over quickly.
55. As an Administrator, I want a scope sheet listing the selected subcontractor's items
    grouped by unit, so that their responsibilities read as a document.
56. As an Administrator, I want coverage figures for the Site — items covered, unassigned,
    double-assigned — so that gaps and overlaps are measured.
57. As an Administrator, I want ticks saved immediately and reflected in the list counts,
    scope sheet and coverage, so that the screen is always current.
58. As an Administrator, I want a Site with no subcontractors to show an empty state with
    the add action, so that the first step is obvious.

### Upload drawings

59. As an Administrator, I want to drop drawing files onto the page or browse for them, so
    that getting drawings in is effortless.
60. As an Administrator, I want to pick a whole folder, so that a drawing set arrives in one
    go.
61. As an Administrator, I want to select many files at once with no cap on the count, so
    that a large set is one batch.
62. As an Administrator, I want the accepted formats (PDF, DWG, DXF, RVT) and the real size
    limit stated, so that I know what will and will not go in.
63. As an Administrator, I want each file's upload progress shown live in a queue (document,
    size, discipline, status), so that I can see a large set moving.
64. As an Administrator, I want uploads to resume after a dropped connection rather than
    restart, so that a 1 GB set is not lost to a blip.
65. As an Administrator, I want a failed file marked as failed with a retry, so that I can
    recover without re-selecting everything.
66. As an Administrator, I want to remove a queued file before it starts, so that a mistaken
    pick costs nothing.
67. As an Administrator, I want "Clear finished" to tidy the queue, so that I see what is
    still moving.
68. As an Administrator, I want the batch summary — documents, total size, uploaded so far —
    beside the queue, so that I know how far along the batch is.
69. As an Administrator, I want each completed drawing recorded against the Site with its
    name, size, discipline and revision, so that a colleague sees it too.
70. As an Administrator, I want the discipline guessed from the sheet code in the file name,
    so that I rarely have to set it.
71. As an Administrator, I want the Site's drawing count and total size shown at the foot of
    the sidebar while in Blueprints, so that I know the size of the set.
72. As an Administrator, I want a "Next step" card pointing to Building structure, so that I
    know where drawings go after upload.

### Language and access

73. As a Chinese-reading Administrator, I want all four screens in Simplified Chinese, so
    that I can manage the building in my own language.
74. As an Administrator using a screen reader, I want the tree, checklist and tables exposed
    with proper roles and names, so that the structure is legible without sight.
75. As an Administrator navigating by keyboard, I want dialogs to trap focus and return it on
    close, and every control to be reachable, so that I am never stranded.

### Building on it

76. As a developer, I want the database schema, constraints and policies in versioned
    migrations, so that every environment is built the same way.
77. As a developer, I want a seed of fictional dev data, so that a fresh environment is
    demoable in one step.
78. As a developer, I want data access confined to small per-entity modules behind query
    hooks, so that screens never import the provider client.
79. As a developer, I want every screen's components to take data as props, so that they
    render in stories and tests without a database.
80. As a developer, I want the tag, table, page-heading, dialog and sidebar-section
    primitives shared, so that later screens reuse rather than reinvent.
81. As a developer, I want the vocabulary — Storey, Floor plan, Unit, Installation,
    Subcontractor, Scope item, Drawing — in the glossary, so that code and copy agree.
82. As a developer, I want the data-access approach recorded in an ADR, so that a later
    developer does not reach around it.

## Implementation Decisions

### Domain

- A building **is a Site**. The Blueprint Manager manages the structure of one Site; the
  page heading shows the Site's name. The console resolves one Site — the first on record —
  in the Blueprints layout; a missing Site renders a "no Site configured" state rather than
  crashing. Site switching is deferred.
- New glossary terms: **Storey** (a vertical zone between two structural levels), **Floor
  plan** (one drawn plan within a storey, the parent of units), **Unit** (a bounded space on
  a floor plan — a tenancy or room group), **Installation** (a piece of equipment installed in
  a unit), **Subcontractor** (an external company in charge of scope items), **Scope item**
  (one of a fixed list of trades, lettered A–F, assignable per unit), **Drawing** (an
  uploaded architect's file). "Level" is an elevation, never a storey; "vendor" is not used.

### Persistence

- **Supabase Postgres** tables: `sites`, `storeys`, `floor_plans`, `units`, `installations`,
  `subcontractors`, `scope_assignments`, `drawings`. All carry a uuid id, created and updated
  timestamps (trigger-maintained), and a Site reference directly or through their parent.
  Fields follow the prototype's dialogs and detail cards; storey height is derived from the
  two levels, never stored. Enumerations: unit status (occupied, vacant, fit-out),
  installation state (live, commissioning, scheduled), drawing status (queued, uploading,
  uploaded, failed).
- **Constraints**: storey number unique per Site; floor plan code and unit code unique per
  Site; asset tag unique per Site; `level_to > level_from`; areas and heights non-negative;
  scope assignment unique on (subcontractor, unit, scope code). Parent references restrict
  deletion — a row with children cannot be deleted — so the "blocked delete" rule is enforced
  by the database as well as the screen.
- **Row-level security**: any authenticated Administrator may read and write every table and
  the drawings bucket; anonymous access is denied. Roles and permissions remain out of scope.
- A **storage bucket** for drawings, private, with objects keyed by Site, a generated id and
  the original file name; its policies live in the same migration.
- A **dev-only seed** creates one Site ("Harbourline Tower · Block B") and the prototype's
  storeys, plans, units, installations, subcontractors and assignments, clearly marked
  fictional. Migrations and seed are applied by a person with project access; this
  environment has no database tooling.
- The **Database type** is hand-written to match the migration now and replaced by the
  generated type later without changing any caller.

### Data access

- Recorded in an ADR: a thin **per-entity data module** over the existing provider client,
  each exposing list/read/create/update/delete functions typed against the Database type,
  and **query hooks** on the existing query library that call them, keyed by Site and entity,
  with mutations invalidating the keys they affect. Screens (pages) call hooks; components
  receive data and callbacks as props and never import the client. No component-level
  caching, no optimistic updates in the first cut except the scope-assignment tick, which is
  optimistic because it is a single toggle and the screen would feel broken otherwise.
- Provider errors are mapped to a small closed set (unique violation → field error naming
  the field; restrict violation → blocked-delete message; everything else → a generic alert),
  by a pure function, as the sign-in spec did for authentication errors.

### Navigation and layout

- The sidebar gains a **section**: a parent row ("Blueprints", building icon) that links to
  the structure screen and, while the current path is inside Blueprints, shows four indented
  child rows. The section is a new layout primitive alongside the existing sidebar item; the
  navigation configuration gains the notion of children.
- Routes: a Blueprints layout route (resolving the Site) with children for structure (with
  storey or plan selection in search params), units (with a plan selector), a single unit by
  id, subcontractors, and upload; the bare Blueprints path redirects to structure.
- A shared **page heading** primitive: title, a context line (the Site name), and an actions
  slot. Blueprint screens use it; the console-wide header strip remains a later step.
- While in Blueprints the sidebar's foot shows the Site's drawing count and total size,
  supplied through the existing status slot.

### Screens

- **Structure**: tree (expand/collapse state local; selection in the URL), detail card, child
  table. Create/edit dialogs per kind; "+" on a tree row targets that row. Deletes confirm by
  name and are disabled with an inline reason when children exist.
- **Units**: list of a floor plan's units with a plan selector; unit screen with breadcrumb,
  detail card, installations table with create/edit/delete, and the sheet-reference card
  (linked drawing name and an open action, or "No drawing linked").
- **Subcontractors**: list with add/edit/delete; checklist rendered as a tree of rows with
  tri-state unit boxes (none / some / all); first tick on a unit applies default scope codes;
  other holders of an item named beside it; scope sheet grouped by unit; coverage over the
  whole Site (items covered / unassigned / double-assigned), labelled as Site-wide.
- **Upload**: drop zone plus file and folder pickers; queue in memory (a reload drops
  unfinished uploads, and the copy says so); each file uploads through the resumable protocol
  to the bucket with live progress, retry on failure, remove while queued; a drawing row is
  inserted on completion; discipline parsed from the sheet code prefix (A, S, M, E →
  Architectural, Structural, Mechanical, Electrical; otherwise Unassigned) and revision from a
  trailing "rev X" if present; the accepted formats and the real size limit are stated. One
  new dependency for resumable uploads.

### Forms and primitives

- Dialogs use the headless dialog already in the project inside the blueprint frame, with the
  form library and schema validator the sign-in form uses; each entity has a schema that
  mirrors the database constraints so most errors are caught before a request.
- New shared UI primitives: **tag** (status chips with the prototype's three tones), **table**
  (plain, styled on the design system's table class; no sorting), **page heading**, **confirm
  dialog**. Stories for each.

### Internationalisation

- Every string in both locales; Chinese machine-authored and flagged for review as before.
  Pluralised counts use the i18n library's plural forms.

## Testing Decisions

### What makes a good test here

A good test states what an Administrator or a consuming developer can observe: what is
rendered, what is announced, what a control does, what is sent to the provider, where a
navigation lands. It finds things by role, name and text; never by class or internals.

### Seams

**The single existing seam is kept: the provider's HTTP boundary**, intercepted by the
end-to-end runner — now covering the REST endpoints and the storage endpoints as well as
authentication. End-to-end tests exercise the real router, real hooks, real components and
real forms against intercepted responses.

**No new seam is added.** Because components take data and callbacks as props, the unit
layer renders them directly (inside the real in-memory router where links are involved, as
the shell tests do). Data modules are thin enough that their only meaningful test is
end-to-end against the intercepted boundary. The error-mapping and discipline-parsing
functions are pure and tested as tables.

### Unit tests

- **Primitives** — tag tones; table renders rows and headers; page heading renders title,
  context and actions; confirm dialog names the item and disables when blocked; sidebar
  section shows children only when current.
- **Structure tree** — renders nodes with kind, label and count; expand/collapse; selection
  callback; "+" targets the right row.
- **Detail card and child tables** — render supplied fields and rows; actions call back.
- **Entity dialogs** — each schema's validation (required, uniqueness message on the mapped
  error, level ordering, non-negative numbers); submit calls back with the entered values;
  edit mode is pre-filled.
- **Checklist** — tri-state unit box from item states; ticking a unit/item calls back with the
  right keys; default scope codes applied on first tick; other holders shown.
- **Scope sheet and coverage** — pure derivations from assignments.
- **Upload queue** — rows reflect status and progress; remove while queued; clear finished;
  discipline and revision parsing table.

### End-to-end tests

At the single seam, with REST and storage intercepted and the faked session:

- Blueprints section appears in the sidebar, expands inside the section, and each sub-route
  loads.
- Structure: creating a storey sends the expected insert and the tree shows it; editing sends
  an update; deleting a storey with plans is blocked; selection survives reload via the URL.
- Unit: opening a unit from the table lands on its screen; adding an installation sends the
  insert and the table shows it.
- Subcontractors: ticking an item sends the insert, unticking the delete; coverage updates.
- Upload: picking a file sends resumable-upload requests with progress and then the drawing
  insert; the queue reaches "Uploaded".

### Prior art

The console shell spec's in-memory-router component tests and the auth spec's interception
are the models. The sign-in form is the model for schema-driven dialogs. The component
folder convention is followed.

## Out of Scope

- Site switching and multi-Site views; the console works on the first Site on record.
- Matching uploaded sheets to storeys ("Review unmatched"), "Import from sheet", drawing
  viewing beyond opening the stored file, and any parsing of drawing contents.
- "Issue work order" and any link to work orders; "Manage" on installations beyond edit and
  delete.
- The unit "Recent changes" log and any audit trail.
- Editable scope-item lists; A–F is a fixed constant.
- Cascading deletes; roles and permissions; the console-wide header strip.
- Applying migrations or seed from this environment (no database tooling here).

## Further Notes

- **The prototype's "no file size limit" is false** on the chosen storage; the screen states
  the real limit and the copy is not copied verbatim.
- **The first tick pre-ticking default scope codes** is a convenience that can surprise; the
  unit row's partial mark and the scope sheet make the effect visible immediately, and a
  second click on the unit box clears it.
- **Seed data is fiction.** It exists so the screens are demoable; it must never be applied to
  a production project.
- **The Database type will drift** from the migration if either is edited alone; the note in
  the type says to regenerate. Until a generated type replaces it, reviewers should read
  migration and type together.
- **Optimistic ticking** is the one place the screen shows state before the provider confirms
  it; on failure it reverts and shows the generic alert.
