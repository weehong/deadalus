# Spec: The Subcontractor Directory and its Members

Status: ready-for-agent
Created: 2026-09-09

Synthesised from the grilling interview of 2026-09-09. Vocabulary follows
`CONTEXT.md` (Administrator, Session, Console, Directory, Subcontractor,
Member, Project, Item, Assignment). ADR-0001 (Supabase authentication),
ADR-0003 (single tenant, Members scoped to their Subcontractor) and ADR-0004
(one global Directory) apply throughout.

## Problem Statement

An Administrator who opens Subcontractors in the Console sees "This screen is
not built yet." The companies they hire and the people they phone on site
exist nowhere in Daedalus. Every feature that follows, assigning Items to a
Subcontractor and letting that company's people record progress, needs those
companies and people to exist first, with a phone number that can later become
a sign-in identity.

## Solution

Subcontractors becomes the Directory: a searchable, paged list of every
Subcontractor the organisation works with. An Administrator creates a
Subcontractor by entering the company's name and its first Member's name and
phone number in one form. Each Subcontractor has a screen of its own where the
Administrator renames the company, adds, edits and removes Members, and
deletes the company outright. A Subcontractor always keeps at least one Member,
every phone number is unique across Daedalus, and every company name is unique
in the Directory.

## User Stories

1. As an Administrator, I want Subcontractors in the sidebar to open a real Directory instead of a placeholder, so that the companies I work with live in Daedalus.
2. As an Administrator, I want the Directory to list every Subcontractor sorted by name, so that I can scan the companies alphabetically.
3. As an Administrator, I want each Directory row to show the company name, how many Members it has, and their phone numbers, so that I can see who to call without opening the company.
4. As an Administrator, I want to search the Directory by company name, so that I can find a company quickly in a long list.
5. As an Administrator, I want the same search to match a Member's name or phone number, so that I can find a company by the person I know.
6. As an Administrator, I want a phone search to match regardless of spaces or a missing country code, so that typing 9123 4567 finds +6591234567.
7. As an Administrator, I want the search to run against the server as I type, with a short pause so that every keystroke does not fire a request.
8. As an Administrator, I want the Directory paged, with the current page, total pages and total count visible, so that a large Directory stays navigable.
9. As an Administrator, I want a search to return me to the first page, so that I never land on an empty page of filtered results.
10. As an Administrator, I want an empty Directory to say so and invite me to create the first Subcontractor, so that an empty table is not mistaken for a loading failure.
11. As an Administrator, I want a search with no matches to say that nothing matched, so that I know the search worked.
12. As an Administrator, I want a loading state while the Directory fetches, so that I know the page is working.
13. As an Administrator, I want a clear error with a retry when the Directory fails to load, so that a network problem does not leave a blank screen.
14. As an Administrator, I want a "New subcontractor" action in the Directory's header row, so that creating a company starts from where I look for one.
15. As an Administrator, I want the New subcontractor form to ask for the company name, the first Member's name and the first Member's phone number, so that a company is never created without someone to call.
16. As an Administrator, I want each of those three fields to be required, with a field-level message when I leave one blank, so that I know exactly what to fix.
17. As an Administrator, I want to type a phone number as I would say it, with or without spaces and with or without +65, so that I am not forced into a format.
18. As an Administrator, I want a phone number that cannot be a valid number to be rejected before I submit, so that typos are caught early.
19. As an Administrator, I want to be told when a company with that name already exists, so that I open the existing entry instead of creating a duplicate.
20. As an Administrator, I want to be told when a phone number already belongs to a Member of another company, and which company, so that I can resolve the clash.
21. As an Administrator, I want a company name compared without regard to case or surrounding spaces, so that "Acme Pte Ltd" and "acme pte ltd " are treated as the same company.
22. As an Administrator, I want a successful creation to take me to the new Subcontractor's screen, so that I can confirm what I entered and add more Members.
23. As an Administrator, I want a Cancel action on the form that returns me to the Directory, so that I can back out without saving.
24. As an Administrator, I want the submit button to show a busy state while saving, so that I do not create the company twice.
25. As an Administrator, I want a server failure during creation shown inline with my input intact, so that I can retry without retyping.
26. As an Administrator, I want a Subcontractor's screen to show the company name as its heading with "Subcontractor" as the kicker, so that I know which company I am looking at.
27. As an Administrator, I want a way back to the Directory from a Subcontractor's screen, so that navigation is never a dead end.
28. As an Administrator, I want to rename a Subcontractor from its screen, so that a typo or a change of trading name is fixable.
29. As an Administrator, I want renaming to obey the same uniqueness rule as creation, so that two companies cannot end up with one name.
30. As an Administrator, I want a Subcontractor's screen to list its Members with name and phone number, so that everyone I can call is in one place.
31. As an Administrator, I want to add a Member with a name and phone number from the Subcontractor's screen, so that a company can have more than one contact.
32. As an Administrator, I want to edit a Member's name or phone number, so that a wrong entry is correctable.
33. As an Administrator, I want a Member's phone number to be unique across all Subcontractors, so that a phone identifies exactly one person when phone sign-in arrives.
34. As an Administrator, I want to remove a Member, so that someone who has left the company disappears from Daedalus.
35. As an Administrator, I want removing the last Member to be refused with an explanation, so that a Subcontractor never becomes uncontactable.
36. As an Administrator, I want to delete a Subcontractor from its screen, so that a company we no longer work with leaves the Directory.
37. As an Administrator, I want deletion to ask for confirmation naming the company and its Member count, so that I cannot delete by accident.
38. As an Administrator, I want deleting a Subcontractor to remove its Members with it, so that no orphaned people remain.
39. As an Administrator, I want a successful deletion to return me to the Directory, so that I see the company is gone.
40. As an Administrator, I want a link to a Subcontractor that no longer exists to show a "not found" state with a way back, so that a stale bookmark is not a crash.
41. As an Administrator, I want every change to appear in the Directory and the Subcontractor screen immediately after it succeeds, so that what I see is the server's copy, not a guess.
42. As an Administrator, I want Subcontractors marked as the active sidebar entry on the Directory, the form and every Subcontractor's screen, so that I always know where I am.
43. As an Administrator, I want phone numbers displayed in one consistent form everywhere, so that the same person reads the same way in every list.
44. As an Administrator using Chinese, I want the Directory, the form, the Subcontractor screen, every message and every validation error translated, so that the feature reads in my language.
45. As an Administrator on a phone, I want the Directory and the forms to fit the narrow content column, so that nothing scrolls sideways.
46. As a keyboard user, I want every action in the Directory and on a Subcontractor's screen reachable and operable by keyboard, so that I do not need a pointer.
47. As a keyboard user, I want focus to move into the delete confirmation when it opens and back to the delete control when it closes, so that I am never focused on something hidden.
48. As a screen-reader user, I want the Directory rendered as a real table with column headers, so that I can navigate it by cell.
49. As a screen-reader user, I want validation errors associated with their fields, so that they are announced when the field is focused.
50. As a screen-reader user, I want the delete confirmation exposed as a dialog with a name, so that I understand I am being asked something.
51. As a visitor without a Session, I want the Directory, the form and every Subcontractor screen to send me to Sign in, so that nothing is reachable by URL.
52. As a developer, I want every Subcontractor API route to refuse a request without a verified token, so that the Directory is never exposed anonymously.
53. As a developer, I want Members reachable only through their Subcontractor's routes, so that the shape required by ADR-0003 exists from the first Member.
54. As a developer, I want the server to be the authority on phone normalisation, so that a client that skips it cannot store a malformed number.
55. As a developer, I want a Subcontractor and its first Member created in one transaction, so that the invariant "at least one Member" holds at every instant.
56. As a developer, I want a duplicate name or phone to surface as a 409 with a stable code, so that the client can show the right message without parsing text.
57. As a developer, I want the Subcontractor routes documented in the OpenAPI document, so that the contract is visible alongside the existing routes.
58. As a developer, I want the API contract asserted at the HTTP seam with Prisma mocked and a signed test token, so that the guard, validation and envelopes are covered without a live database.
59. As a developer, I want the browser flow covered end to end with the provider and the Subcontractor API intercepted at the browser's edge, so that e2e runs without a real account or database.
60. As a developer, I want each new presentational component to have a story and a test beside it, so that the convention set by the Console shell holds.
61. As a developer, I want the placeholder "not built yet" removed from Subcontractors, so that nothing false remains in the Console.
62. As a developer, I want SPEC.md and README to describe the Directory as built, so that the next session starts from the truth.

## Implementation Decisions

### Domain model

- Two persisted concepts, **Subcontractor** and **Member**, in the dedicated
  `daedalus2` schema per ADR-0002. No Project reference on either, per ADR-0004.
- **Subcontractor** carries an opaque id, the display name as entered (trimmed),
  a normalised name key (lower-cased, trimmed, internal whitespace collapsed)
  that carries the unique constraint, and created and updated timestamps.
  The name key exists because the database cannot express case-insensitive
  uniqueness through the ORM's schema; the service derives it on every write.
- **Member** carries an opaque id, the owning Subcontractor's id, a required
  name (trimmed), a required phone number stored in E.164, and timestamps.
  The phone number carries a unique constraint across the whole table. The
  Subcontractor reference deletes its Members with it.
- Invariant: a Subcontractor has at least one Member at all times. Enforced
  in the service (creation is one transaction; removal of the last Member is
  refused), not in the database.
- Member names are not unique. Two Members of one Subcontractor may share a
  name; the phone tells them apart.

### Phone numbers

- Canonical form is E.164. The server normalises every phone it receives:
  strip spaces, hyphens, brackets and dots; a leading `00` becomes `+`; a
  number with no `+` is given the default country code +65; the result must
  match E.164 (a `+`, then 8 to 15 digits, first digit non-zero). Anything
  else is a validation error on the phone field.
- Normalisation lives in one pure function on the server, unit-tested, and
  is the only place the default country code appears.
- The client trims and sends what the Administrator typed; it does not
  normalise. It displays phone numbers exactly as stored. Prettier grouping
  is deferred.
- Search input is normalised the same way for its phone match: digits only
  are compared, so a query of "9123 4567" matches "+6591234567".

### API contract

All routes are versioned under the existing `/api/v1` prefix, mounted behind
the existing token check at the router level, so no individual handler can be
added unguarded. Responses use the existing `{ data }` envelope; errors use
the existing `{ error: { code, message, details } }` envelope.

- **List Subcontractors**: `GET /subcontractors?q=&page=&pageSize=`.
  `q` optional, trimmed; `page` defaults to 1; `pageSize` defaults to 20 and
  is capped at 100. Matches when `q` is a case-insensitive substring of the
  company name, or of any Member's name, or when `q`'s digits are a substring
  of any Member's phone digits. Sorted by name key ascending. Returns
  `{ data: [...], meta: { page, pageSize, total } }`, where each row carries
  id, name, member count and the Members' phone numbers. `meta` is a new,
  optional addition to the success envelope used only by paged lists.
- **Create Subcontractor**: `POST /subcontractors` with
  `{ name, member: { name, phone } }`. Returns 201 with the full
  Subcontractor (id, name, members[]). 400 on validation; 409 with code
  `SUBCONTRACTOR_NAME_TAKEN` on a duplicate name key; 409 with code
  `MEMBER_PHONE_TAKEN` and `details: { subcontractorId, subcontractorName }`
  on a duplicate phone.
- **Read Subcontractor**: `GET /subcontractors/:id`. Returns the full
  Subcontractor with its Members sorted by name then phone. 404 otherwise.
- **Rename Subcontractor**: `PATCH /subcontractors/:id` with `{ name }`.
  Same 409 rule as creation. Returns the full Subcontractor.
- **Delete Subcontractor**: `DELETE /subcontractors/:id`. Removes it and its
  Members. Returns 204. 404 otherwise. When Assignments exist in a later
  feature, this route will return 409 while any reference the Subcontractor;
  that check is not built now.
- **Add Member**: `POST /subcontractors/:id/members` with `{ name, phone }`.
  Returns 201 with the full Subcontractor. 404 for an unknown Subcontractor;
  409 `MEMBER_PHONE_TAKEN` as above.
- **Edit Member**: `PATCH /subcontractors/:id/members/:memberId` with
  `{ name?, phone? }`, at least one present. Returns the full Subcontractor.
  404 when the Member does not exist or does not belong to that
  Subcontractor. 409 `MEMBER_PHONE_TAKEN` as above.
- **Remove Member**: `DELETE /subcontractors/:id/members/:memberId`. Returns
  204. 404 as for edit. 409 with code `LAST_MEMBER` when the Member is the
  Subcontractor's only one.
- A Member route always resolves the Member through its Subcontractor's id
  in the path; a Member id belonging to a different Subcontractor is a 404,
  never a hit. This is the route shape ADR-0003 requires.
- Uniqueness is enforced by the database constraints and translated: the
  service catches the unique-violation error, identifies the constraint, and
  throws the matching 409. A 409 code is added to the shared HTTP error type
  as a `conflict` factory.
- Every route is registered in the OpenAPI document with its schemas.

### Server modules

- One zod schema module for the Subcontractor and Member request shapes,
  including the paging query. The phone field applies the normaliser as a
  transform so downstream code only ever sees E.164.
- One service module owning both concepts, exposing list, create, get,
  rename, delete, addMember, editMember, removeMember over the shared Prisma
  singleton. Transport mapping (timestamps to ISO strings, the row shape for
  lists) lives here as in the existing pattern.
- One controller module and one router module, following the existing
  route, controller, service split.
- The example `matches` slice is left in place; its removal is not part of
  this feature.

### Frontend

- A new feature module for Subcontractors holding the API client functions
  (over the existing fetch helper, which already attaches the bearer token),
  the TanStack Query hooks with a single query key family keyed by the list
  parameters and by Subcontractor id, and the screens.
- Mutations invalidate the list and the affected Subcontractor's query on
  success, so screens show the server's copy.
- Routes under the existing guarded Console layout route: the Directory at
  `/subcontractors`, the creation form at `/subcontractors/new`, and the
  Subcontractor screen at `/subcontractors/$id`. `new` is a fixed segment and
  takes precedence over the id segment. The sidebar entry stays active for
  all three because the router's active matching is prefix-based.
- The Directory uses the shared Page and PageHeader (kicker "Directory",
  heading "Subcontractors", actions slot holding search and "New
  subcontractor"). The table is a TanStack Table with manual pagination and
  server-driven data; search input is debounced with the existing hook and
  resets the page to 1.
- The creation form and the Member forms use react-hook-form with zod
  resolvers, the existing Field and Input primitives, and the same
  field-level error presentation as the sign-in form. Server 409s are mapped
  to a field error on name or phone by their code; other failures show the
  shared Alert.
- The Subcontractor screen uses PageHeader (kicker "Subcontractor", heading
  is the company name, actions slot holding Rename and Delete). Members
  render as a table with an inline row form for add and edit and a Remove
  action per row. Rename opens an inline form in place of the heading.
- Delete confirmation is a modal dialog: labelled, focus-trapped, closes on
  Escape, returns focus to the trigger. A new `Dialog` UI primitive is added
  with a story and a test, since none exists.
- New copy is added to both locale files; zh-CN strings are
  machine-translated and flagged, per the existing convention.
- The `notBuilt` placeholder stays for Projects only.

## Testing Decisions

A good test drives the system from outside a seam and asserts what an
Administrator or a client would observe: status codes, envelopes, rendered
text and roles. Tests do not reach into services, stores or component
internals, and do not assert on how a query was built.

### Seam 1: the API over HTTP

- Supertest against the whole app built from the app factory, as the
  existing route tests do. Prisma is mocked at the singleton, as the
  matches route test does, including the transaction wrapper. Requests carry
  a token signed by the test key and verified against the stubbed JWKS, as
  the me-route test does.
- Covers: 401 without and with an invalid token on every route; list paging
  defaults, caps and the `meta` block; the search query reaching the data
  layer in normalised form; creation happy path and each 400 and 409;
  phone normalisation of several input shapes; 404 for an unknown
  Subcontractor and for a Member reached through the wrong Subcontractor;
  last-Member refusal; delete returning 204; the OpenAPI document listing the
  new paths.
- The phone normaliser is the one unit test outside the seam, because it is
  a pure function with many input shapes.
- Prior art: the matches and me route integration tests, and the auth
  service unit test.

### Seam 2: the browser through the Console

- Playwright signs in through the intercepted provider, as the existing
  auth and example specs do. A new browser-edge intercept for
  `/api/v1/subcontractors*` answers from an in-memory fake that implements
  the contract above, including paging, search, the 409s and the
  last-Member rule. This extends the "intercept at the browser's edge"
  approach ADR-0001 records; the backend is not started for these specs.
- Covers: the placeholder is gone and the table renders; search filters and
  resets the page; paging controls; creating a company lands on its screen;
  field errors for blank fields and a bad phone; the duplicate-name and
  duplicate-phone messages; adding, editing and removing a Member; the
  last-Member refusal message; renaming; delete confirmation with focus
  handling and return to the Directory; the not-found state; the sidebar's
  active entry on all three routes; the unauthenticated redirect.
- Prior art: the existing auth and example e2e specs and the provider
  intercept module.

### Component tests

- Each new presentational component (Dialog, the table, the forms) gets a
  story and a testing-library test beside it, as the Console shell
  components do. These assert roles, labels and callbacks with plain props,
  not data fetching.

## Out of Scope

- Member sign-in by phone, OTP delivery, and any Member-facing screen. The
  phone field is stored for that future; nothing here sends a message.
- Assignments, Items, and refusing deletion while Assignments exist.
- Any Project relationship for a Subcontractor (ADR-0004).
- Multi-tenancy or per-Administrator visibility (ADR-0003).
- Soft delete, archiving, or audit history.
- Additional Subcontractor fields the sibling repository carries (trade,
  email, contract reference). The name is the only company field.
- A primary or default Member.
- Phone number display formatting beyond the stored E.164 string.
- Bulk import or export of the Directory.
- Removing the example `matches` slice.

## Further Notes

- The default country code is +65 by decision, not by detection. If Daedalus
  is deployed for another market it becomes configuration; today it is a
  constant in the normaliser.
- The `meta` block is the first paged response in the API. Later lists
  (Projects, Units) should reuse its shape.
- The sibling repository stores subcontractors per site with more fields;
  this repository deliberately diverges (ADR-0004) and starts narrow.
- Playwright cannot run on the development host until its system
  dependencies are installed with sudo, so seam 2 specs are written to the
  contract and verified in an environment where Playwright runs.
