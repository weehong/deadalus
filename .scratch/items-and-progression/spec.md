# Spec: Items, Progression and the Field

Status: ready-for-agent
Created: 2026-09-12

Synthesised from the grilling interview of 2026-09-11 and 2026-09-12.
Vocabulary follows `CONTEXT.md` (Administrator, Member, Subcontractor,
Console, Field, Project, Block, Storey, Unit, Unit Type, Item Catalogue,
Catalogue Item, Item, Assignment, Progression, Progress entry, Session).
ADR-0001 (Supabase authentication), ADR-0003 (single tenant, Members scoped
to their Subcontractor), ADR-0004 (one global Directory), ADR-0008 (Items are
per-Unit copies made from a per-Project Item Catalogue) and ADR-0009 (Member
Sessions issued by the API for the proof of concept) apply throughout.

## Problem Statement

A Project's Structure is set out, but nothing is tracked against it. An
Administrator cannot say what has to be installed in each Unit, which
Subcontractor is responsible for it, or how far it has come; and a
Subcontractor's Members have no way into Daedalus at all. The README's two
core concepts, the Unit and the progress recorded against it, are half
built.

## Solution

Each Project gains an Item Catalogue, a list of Item names. An Administrator
applies a Catalogue Item to a chosen set of Units in one action, creating an
Item in every selected Unit, then assigns those Items to a Subcontractor in
bulk. Each Item carries a Progression, a whole-number percentage recorded as
a history of dated Progress entries with an optional note. Every Unit,
Storey, Block and Project shows a Progression that is the plain average of
the Items beneath it. Administrators enter progress from the Unit card in
the Console.

Members sign in to the Field, a mobile-first surface in the same frontend,
with their phone number alone; for this proof of concept the API issues the
Member's Session itself (ADR-0009). A Member walks Project, Block, Storey
and Unit, seeing only where their Subcontractor holds Items and their
Subcontractor's own Progression at each level, and enters progress on their
Items.

## User Stories

### Item Catalogue

1. As an Administrator, I want an Items tab on the Project screen listing the Project's Catalogue Items with how many Units hold each, so that the scope of work per Project is visible.
2. As an Administrator, I want to add a Catalogue Item with a required name, unique within the Project however it is spaced or cased, so that "Kitchen cabinet" is defined once.
3. As an Administrator, I want to rename a Catalogue Item and see every Item made from it renamed, so that a typo is fixed in one place.
4. As an Administrator, I want deleting a Catalogue Item that Units still hold to be refused with the count, so that no Item vanishes with its history.

### Applying Items to Units

5. As an Administrator, I want to apply a Catalogue Item to a set of Units chosen by Block, Storeys and Unit Types, with all of them as the default, so that one action fills a whole tower.
6. As an Administrator, I want the apply dialog to preview how many Units will receive the Item and how many already hold it, so that I know what one click does.
7. As an Administrator, I want Units that already hold the Item skipped rather than duplicated, and the result to say how many were added and skipped, so that applying twice is safe.
8. As an Administrator, I want to remove a Catalogue Item's Items from a chosen set of Units after a confirmation naming the Item and Progress entry counts that go, so that a wrongly applied Item can be undone knowingly.

### Assignment

9. As an Administrator, I want to assign a Catalogue Item's Items across a chosen set of Units to one Subcontractor in one action, so that a company's scope is set in seconds.
10. As an Administrator, I want bulk assign to skip Items already assigned to another Subcontractor unless I tick "Reassign", and to tell me the counts before and after, so that I never clobber another company's scope by accident.
11. As an Administrator, I want to assign, reassign or unassign one Item from its Unit card, so that a single exception is quick.
12. As an Administrator, I want an Item's Progress entries and Progression to survive reassignment and unassignment, so that history is never lost.
13. As an Administrator, I want deleting a Subcontractor that holds Assignments to be refused with the count, so that Items never silently lose their company.

### Progression

14. As an Administrator, I want to enter a Progress entry on an assigned Item from its Unit card: a whole number from 0 to 100 and an optional short note, so that progress is recorded where the work is.
15. As an Administrator, I want an entry on an Item with no Assignment to be refused with a message, so that responsibility is settled before progress is claimed.
16. As an Administrator, I want each Item to show its Progression, its Subcontractor and its latest entry's date and author, with the full history one tap away, so that a claim can be checked.
17. As an Administrator, I want a later entry to be allowed to be lower than the previous one, so that a mistake or rework is recordable.
18. As an Administrator, I want every Unit, Storey and Block row on the Structure tab and every Project in the list to show its Progression, the plain average of the Items beneath it with unassigned Items at 0, so that the state of a development is readable at every level.
19. As an Administrator, I want a Unit, Storey, Block or Project with no Items to show no Progression rather than 0, so that "nothing defined" is never mistaken for "nothing done".
20. As an Administrator, I want deleting a Unit, Storey or Block to name the Items and Progress entries that go with it, so that history is never lost by surprise.

### The Field

21. As a Member, I want to sign in at `/field/login` by entering my phone number, so that I can reach my work without an account to remember.
22. As a Member, I want an unregistered phone number to be told so plainly, so that I know to ask my Administrator.
23. As a Member, I want my Session to survive a page reload and to last thirty days, and a way to sign out, so that I am not asked to sign in every morning.
24. As a Member, I want to be signed out automatically if my Administrator removes me, so that a former Member cannot keep entering progress.
25. As a Member, I want the Field to list only the Projects where my Subcontractor holds Items, each with our Progression there, so that I see my work and nothing else.
26. As a Member, I want to walk a Project by Block, Storey and Unit, seeing only where we hold Items and our Progression at each level, so that I can find a Unit the way the building is built.
27. As a Member, I want a Unit to list our Items with their Progression and latest entry, and to enter a new Progress entry on any of them, so that I record progress on the spot.
28. As a Member, I want the Field to work one-handed on a phone with large controls and no sideways scrolling, so that it is usable on site.
29. As a Member using Chinese, I want every Field screen translated, so that it reads in my language.
30. As a visitor without a Member Session, I want every Field screen to send me to the Field's sign in, so that nothing is reachable by URL.

### Developer

31. As a developer, I want every Console route in this feature behind the existing Administrator token check and every Field route behind a separate Member check that loads the Member on each request and derives the Subcontractor from it, so that ADR-0003 holds and a client-supplied id never reaches another company's Items.
32. As a developer, I want a Field request naming an Item, Unit or Project outside the Member's Subcontractor to be a 404, never a 403, so that nothing about other companies' work is revealed.
33. As a developer, I want roll-ups computed on read from a stored current Progression per Item, so that no summary can drift from its entries.
34. As a developer, I want every route registered in the OpenAPI document and asserted at the HTTP seam with Prisma mocked, the Field covered end to end against a browser-edge fake at phone width, and each new presentational component to have a story and a test, so that the feature is verified without a live database or account.
35. As a developer, I want the README and SPEC.md to describe Items, Progression and the Field as built, and the glossary's "flow that is not yet built" wording gone, so that nothing false remains.

## Implementation Decisions

### Domain model

Three new persisted concepts in the `daedalus2` schema (ADR-0002), beside
the existing Project, Block, Storey, Unit, Unit Type, Subcontractor and
Member.

- **CatalogueItem** (`catalogue_items`): opaque id, Project id (cascade),
  name as entered (trimmed, 1 to 60 characters), name key (the shared
  `name-key` normalisation) unique on (projectId, nameKey), timestamps.
- **Item** (`items`): opaque id, Unit id (cascade), CatalogueItem id
  (`onDelete: Restrict`; the service refuses first), optional Subcontractor
  id (`onDelete: Restrict`; the service refuses first) with `assignedAt`,
  `progression` integer 0 to 100 defaulting to 0, timestamps. Unique on
  (unitId, catalogueItemId). Indexes on (catalogueItemId), (subcontractorId)
  and (unitId). An Item has no name of its own; its name is its Catalogue
  Item's, which is how rename flows down.
- **Assignment** is the Item's Subcontractor reference and `assignedAt`;
  there is no Assignment table. An Item with a null reference has no
  Assignment.
- **ProgressEntry** (`progress_entries`): opaque id, Item id (cascade),
  `value` integer 0 to 100, optional `note` (trimmed, 1 to 200 characters
  when given), `enteredByKind` enum `administrator | member`,
  `enteredById` (the Supabase subject or the Member id), `enteredByName`
  snapshot (the Administrator's email or the Member's name),
  `subcontractorName` snapshot for a Member's entry, `createdAt`. Index on
  (itemId, createdAt, id). Entries are append-only; nothing updates or
  deletes one except cascade from its Item.
- **Progression** of an Item is `items.progression`, written in the same
  transaction as each new entry (the latest entry by createdAt then id),
  so it never drifts. Progression of a Unit, Storey, Block or Project is
  `AVG(items.progression)` over the Items beneath it, `null` when there are
  none, rounded to a whole number for display only. Unassigned Items are
  included at whatever value they hold, which is 0 because they can never
  receive an entry. A Subcontractor's Progression within a scope is the
  same average restricted to its Items.
- **Unit selection**, used by apply, remove and bulk assign: `{ blockIds?,
  storeyIds?, unitTypeIds? }`, each a non-empty array when given, all
  belonging to the Project or the request is a 404. A Unit is selected when
  it matches every filter given; no filters selects every Unit of the
  Project. The client shows the resulting counts from the loaded Project
  before submit; the server is the authority.
- Invariants: an Item never moves between Units or Catalogue Items; an
  entry never changes; a Catalogue Item with Items cannot be deleted; a
  Subcontractor with Assignments cannot be deleted; an Item without an
  Assignment accepts no entry.

### API contract, Console

All under `/api/v1` behind the existing router-level Administrator token
check; `{ data }` envelope, `{ error: { code, message, details } }` on
failure. Writes that change the Structure's summary return the full Project;
counts of a bulk action travel in `meta`.

- **Full Project read** (`GET /projects/:id`) gains `progression: number |
  null` and `itemCount` on the Project, every Block, Storey and Unit, and
  `catalogueItems: [{ id, name, itemCount }]` ordered by name key. It does
  not list Items; a thousand Units times ten Items is a separate read.
- **List Projects** rows gain `itemCount` and `progression`.
- **Add Catalogue Item**: `POST /projects/:id/catalogue-items { name }`.
  201 with the full Project. 409 `CATALOGUE_ITEM_NAME_TAKEN`.
- **Rename Catalogue Item**: `PATCH /projects/:id/catalogue-items/:catalogueItemId { name }`.
  Same 409. **Delete**: `DELETE ...`; 409 `CATALOGUE_ITEM_IN_USE` with
  `details: { itemCount }` while any Item exists; 204 otherwise.
- **Apply to Units**: `POST /projects/:id/catalogue-items/:catalogueItemId/items { blockIds?, storeyIds?, unitTypeIds? }`.
  One transaction creates an Item in every selected Unit that has none for
  this Catalogue Item (`createMany` with `skipDuplicates`). 201 with the
  full Project and `meta: { added, skipped }`.
- **Remove from Units**: `POST /projects/:id/catalogue-items/:catalogueItemId/items/remove { blockIds?, storeyIds?, unitTypeIds? }`.
  Deletes the selected Items and, by cascade, their entries. 200 with the
  full Project and `meta: { removed, entriesRemoved }`.
- **Bulk assign**: `POST /projects/:id/assignments { catalogueItemId, subcontractorId: string | null, reassign?: boolean, blockIds?, storeyIds?, unitTypeIds? }`.
  With a Subcontractor: assigns every selected unassigned Item; with
  `reassign: true`, also every Item assigned elsewhere; Items already
  assigned to that Subcontractor count as skipped. With `null`: unassigns
  every selected Item that has an Assignment. 404 for a Subcontractor that
  does not exist. 200 with the full Project and `meta: { assigned, skipped
  }`.
- **Unit's Items**: `GET /projects/:id/units/:unitId/items` returns
  `{ data: [{ id, catalogueItemId, name, subcontractor: { id, name } | null,
  assignedAt, progression, latestEntry: { value, note, enteredByName,
  createdAt } | null }] }` ordered by name key. The Unit card caches this
  shape per Unit id.
- **Assign one Item**: `PATCH /projects/:id/items/:itemId { subcontractorId: string | null }`.
  200 with the Unit's Items.
- **Enter progress**: `POST /projects/:id/items/:itemId/entries { value, note? }`.
  409 `ITEM_UNASSIGNED` when the Item has no Assignment. 201 with the
  Unit's Items. The entry's author is the token's subject and email.
- **History**: `GET /projects/:id/items/:itemId/entries` returns
  `{ data: [{ id, value, note, enteredByKind, enteredByName,
  subcontractorName, createdAt }] }`, newest first.
- **Delete Subcontractor** gains 409 `SUBCONTRACTOR_HAS_ASSIGNMENTS` with
  `details: { itemCount }`.
- Structure deletes (Unit, Storey, Block, Project) are unchanged in
  contract; the confirmation copy uses the counts already in the full
  Project read plus an `entryCount` added at each level.
- Every child resolves through the Project id in the path; a child of
  another Project is a 404.

### API contract, Field

All under `/api/v1/field`, behind `requireMember`, except the sign-in route.
The Member's Subcontractor is taken from the loaded Member, never from the
request.

- **Sign in**: `POST /field/sessions { phone }`. The phone is normalised
  with the existing `normalize-phone` helper and matched against Members.
  200 `{ data: { token, member: { id, name, subcontractor: { id, name } } } }`.
  404 `MEMBER_NOT_FOUND` with a plain message; with the phone as the whole
  credential there is nothing to hide by being vague. Covered by the
  existing rate limiter.
- **Token**: a JWT signed HS256 with `MEMBER_TOKEN_SECRET` (new, required,
  at least 32 characters), `iss` `daedalus`, `aud` `field`, `sub` the Member
  id, thirty-day expiry, created and verified with `jose`. `requireMember`
  verifies it, loads the Member with its Subcontractor, and answers 401 when
  the token is missing, invalid, expired or names a Member that no longer
  exists. It never accepts a Supabase token, and `requireAuth` never accepts
  a Member token.
- **Me**: `GET /field/me` returns the member shape above.
- **Projects**: `GET /field/projects` returns `{ data: [{ id, code, name,
  itemCount, progression }] }` for Projects where the Subcontractor holds at
  least one Item, ordered by name key; counts and Progression are over the
  Subcontractor's Items only.
- **Project**: `GET /field/projects/:id` returns the Project with Blocks,
  Storeys and Units, each with `itemCount` and `progression` over the
  Subcontractor's Items, omitting any Block, Storey or Unit where it holds
  none. 404 when it holds none in the Project.
- **Unit's Items**: `GET /field/units/:unitId/items` returns the same Item
  shape as the Console route, restricted to the Subcontractor's Items, with
  the Unit's label, Storey, Block and Project code for the heading. 404 when
  it holds none there.
- **Enter progress**: `POST /field/items/:itemId/entries { value, note? }`.
  404 when the Item is not assigned to the Subcontractor. 201 with the
  Unit's Items. Author is the Member's id and name, with the Subcontractor's
  name snapshotted.
- **History**: `GET /field/items/:itemId/entries`, same 404 rule.
- All routes registered in the OpenAPI document under a Field tag with the
  Member bearer scheme.

### Server modules

- One Prisma migration adding the three tables and the enum.
- One zod schema module for the Catalogue Item body, the Unit selection,
  the bulk assign body and the entry body (value integer 0 to 100, note
  optional).
- A Catalogue Item service (add, rename, delete, apply, remove), an
  Assignment service (bulk assign, assign one) and a Progress service
  (enter, as one transaction inserting the entry and updating the Item's
  stored Progression; history; and the roll-up reads). The roll-up reads
  are one query module taking an optional Subcontractor filter, shared by
  the full Project read, the Projects list and the Field, rather than two
  copies.
- A Member authentication service (sign, verify, load) and a
  `requireMember` check beside the existing `requireAuth`, each refusing
  the other's tokens.
- A Field router mounted at `/field` and an Items router mounted under
  `/projects` beside the existing Structure routes, following the existing
  route, controller, service split.
- The Subcontractor delete gains the Assignment count check in its
  existing service.
- The dev seed adds Catalogue Items, Items across the seeded Units, two
  Assignments to the seeded Subcontractors and a few entries, with fixed
  ids so it stays idempotent.

### Frontend, Console

- A new Items feature module: API functions over the existing fetch helper,
  query hooks keyed by Project id and, for the Items read, by Unit id, and
  mutations that write the returned full Project into the cache and
  invalidate the affected Unit's Items.
- A third tab on the Project screen, Items, at `/projects/$id/items`: a
  table of Catalogue Items (name, Units holding it, actions) with an inline
  add row and inline rename, following the Unit Types tab; row actions
  Apply to Units, Assign, Remove from Units, Delete.
- One `UnitSelection` presentational component shared by the three dialogs:
  a Block select (All or one), then Storey and Unit Type checkbox lists with
  select-all, and a live count line computed from the loaded Project ("Will
  add 240 Items, 12 Units already hold it" / "Will assign 240, skip 12
  assigned elsewhere"). The Assign dialog adds a Subcontractor select
  (searching the Directory) and the Reassign tickbox; the Remove dialog is a
  confirmation naming Items and entries.
- Structure tab: every Block, Storey and Unit row shows a `Progression`
  badge (a whole-number percentage, or nothing with an accessible "No Items"
  label). The Unit card gains an Items disclosure: each Item shows name,
  Subcontractor (or "Unassigned"), Progression, latest entry summary, an
  inline "Enter progress" form (number input 0 to 100 and note), a
  Subcontractor select for single Assignment, and a History disclosure
  listing entries newest first.
- Projects list gains a Progression column.
- The Directory's delete dialog shows the has-Assignments refusal inline.

### Frontend, Field

- A new Field feature module: a Member Session read model (Zustand,
  mirrored to browser local storage under one key, with a "restoring"
  state at boot like the Administrator one), a fetch helper that attaches
  the Member bearer token, query hooks, and the screens.
- Routes: `/field/login`; a guarded Field layout that redirects to
  `/field/login` without a Session and carries a minimal header (Member
  name, Subcontractor name, Sign out); `/field` (Projects);
  `/field/projects/$id` (the drill-down: Blocks, then Storeys, then Units,
  one level per screen width on a phone, selection in search params
  `block` and `storey`); `/field/units/$unitId` (Items with entry and
  history). A 401 from any Field request clears the Session and redirects.
- Mobile-first: single column, 44px minimum tap targets, the entry form's
  number input uses `inputmode="numeric"`. Every screen is translated in
  both locales; zh-CN strings machine-translated and flagged.
- The Console's sign-in and the Field's are independent; a browser may hold
  both Sessions.

## Testing Decisions

A good test drives the system from outside a seam and asserts what an
Administrator, a Member or a client would observe.

### Seam 1: the API over HTTP

- Supertest with Prisma mocked at the singleton and the transaction
  wrapper, Administrator requests carrying a token signed by the test key,
  Member requests carrying a token signed with a test `MEMBER_TOKEN_SECRET`.
- Covers: Catalogue Item CRUD, both 409s and the in-use refusal; apply with
  every selection shape, the skip count and the foreign-id 404; remove with
  counts; bulk assign with skip, reassign, unassign and the unknown
  Subcontractor 404; assign one; enter progress including the unassigned
  409, the range 400 and the stored Progression update; history order; the
  full Project's new fields and `null` for no Items; the list's new column;
  Subcontractor delete refusal; Field sign-in happy path and not-found;
  `requireMember` rejecting a missing, expired, wrong-audience and
  Supabase-signed token and a removed Member; every Field read restricted to
  the Subcontractor with 404 for anything outside it; the Field entry route;
  the OpenAPI document listing every path.
- Pure functions unit-tested outside the seam: the selection filter, the
  roll-up average with `null` for empty, the token sign and verify pair.

### Seam 2: the browser

- Console e2e against the existing browser-edge fake, extended with the
  Items routes: the Items tab CRUD and refusals; apply with a preview count
  and result counts; bulk assign with skip and reassign; the Unit card's
  Items, entry, refusal on unassigned, and history; Progression badges and
  the Projects column; the Directory refusal.
- Field e2e against a Field fake at phone width: sign in with a known and an
  unknown phone; Session survives reload; sign out; redirect without a
  Session; the Projects list, the drill-down, the Unit's Items and a
  successful entry; a 401 mid-session clears and redirects; Chinese copy.
- Accessibility checks on both surfaces as the existing Project specs do.
- Each new presentational component (the Unit selection, the Progression
  badge, the Item row, the entry form, the Field list rows) has a story and
  a test.

### Prior art

- HTTP seam: the Subcontractor and Project route tests (Supertest, the
  mocked Prisma singleton and transaction wrapper, a token signed by the
  test key).
- Browser seam: the Project and Subcontractor e2e specs and their
  browser-edge API fakes, and the auth spec's provider fake for sign-in.
- Pure functions: the name-key and code-key helper tests and the batch
  name generator test.

## Out of Scope

- Real Member authentication (SMS one-time code through Supabase). The
  phone-only sign-in is a proof-of-concept exception recorded in ADR-0009;
  the role claim it would need is deferred with it.
- A per-Subcontractor breakdown of Progression in the Console (each
  company's own percentage within a Project or Block). The Console shows
  whole-scope Progression only, with each Item's Subcontractor named.
- Photos or files on a Progress entry. An entry carries a value and an
  optional short note.
- Submitted-versus-approved progress, payment progress and any review
  step. One history per Item; the latest entry is the Progression.
- Weighted roll-ups. Every Item counts equally.
- QR labels and scanning a Unit to open it in the Field.
- Reordering, moving or renaming Items independently of their Catalogue
  Item.
- Copying an Item Catalogue from one Project to another.
- Notifications of any kind.

## Further Notes

- The glossary conflict found at the start of the interview (Item as a
  checklist of tasks versus an entered percentage) was resolved in favour
  of the entered percentage; `CONTEXT.md` was rewritten accordingly and
  "task" and "checklist" are now words to avoid.
- "Site" was rejected as the name of the Member surface because the Project
  entry lists it as a word to avoid; "Field" was chosen instead.
- Ticket order: the catalogue and migration (01) and Member sign-in (07)
  have no blockers and can proceed in parallel; the Field drill-down (08)
  waits on both the live roll-ups (06) and sign-in (07).
- The Subcontractor delete route gains a new 409, so the Directory's delete
  dialog and its e2e spec change as part of this feature.
- `MEMBER_TOKEN_SECRET` becomes a required backend environment variable;
  the test setup, `.env.example` and README must carry it.
- A Unit with no Items shows no Progression and contributes nothing to its
  parent's average; this follows from "mean of all Items beneath" and is
  deliberate, so that "nothing defined" is never read as "nothing done".
- The full Project read carries, on every Unit, an `items` summary of
  `catalogueItemId` and `subcontractorId` (ordered by Catalogue Item id) so
  the apply, remove and assign previews are exact from the loaded Project;
  the Unit card's full Items read, with names and entries, stays a separate
  route (decided during ticket 02).

