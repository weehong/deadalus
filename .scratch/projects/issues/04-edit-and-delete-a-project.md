# 04: Edit a Project's name or code, and delete it

**What to build:** From the Project screen's header actions, Edit opens an inline form in place of the heading with the name and code, under the same validation and uniqueness rules as creation; saving updates the heading and kicker in place. Delete opens a confirmation dialog naming the Project and its Block, Storey and Unit counts; confirming removes the Project and everything under it and returns to the list. The dialog is labelled, focus-trapped, closes on Escape and returns focus to the trigger.

Underneath: `PATCH /projects/:id { name?, code? }` (at least one) with the same 409s as creation, returning the full Project; `DELETE /projects/:id` cascading through Blocks, Storeys, Units and Unit Types, returning 204. Both registered in the OpenAPI document. Mutations write the returned Project into the cache and invalidate the list.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 03 (Open a Project's screen)

**Status:** complete

- [x] The edit route accepts name, code or both, rejects an empty body with 400, returns the full Project, and returns 409 `PROJECT_NAME_TAKEN` and `PROJECT_CODE_TAKEN`; 404 for an unknown id; covered at the HTTP seam
- [x] The delete route returns 204 and cascades (the mocked Prisma call shape shows one delete on the Project; the migration's cascades are asserted by the schema); 404 for an unknown id
- [x] Both routes appear in the OpenAPI document
- [x] The inline edit form has field errors, busy state, Cancel, and maps the 409 codes to fields, in both locales
- [x] The delete dialog names the Project and its counts, handles focus, and returns to the list on success
- [x] The e2e fake implements edit and delete and the e2e spec covers rename, code change, taken name and code on edit, and delete with focus handling
- [x] New components have a story and a test beside them

## Comments

### Implementation evidence (2026-09-11; awaiting integration verification)

- Added guarded PATCH/DELETE operations and OpenAPI registration. PATCH accepts
  either field or both, normalizes code and name, returns the full Project and
  maps both uniqueness conflicts and missing records.
- Deletion uses one transaction: remove the Project's Blocks (cascading Storeys
  and Units), then delete the Project (cascading Unit Types). This deliberately
  corrects the original single-delete assumption: a live database probe found
  that directly deleting a Project with typed Units fails with P2003 under the
  required Unit Type Restrict relation. No schema restriction was weakened.
- Project header now edits in place with the shared prefilled ProjectForm;
  returned Project data replaces the detail cache and invalidates the list.
  DeleteProjectDialog reuses Dialog and includes descendant counts, busy and
  failure states. English and machine-translated Chinese copy are present.
- Targeted HTTP suite: 18 passing tests (partial fields, invalid bodies, both
  409s, missing Projects, authentication, ordered deletion and OpenAPI).
- Targeted component suites: 14 passing tests, including prefilled edit/saving
  behavior and delete confirmation, retryable failure and pending dismissal.
  Edit/saving stories and delete dialog default/pending/failure stories added.
- Both app typechecks and targeted production/test lint checks passed.
- Browser fake supports PATCH/DELETE; four browser scenarios cover rename/code,
  conflicts/Cancel, focus trap/Escape/return/delete and Chinese editing/deletion.
  Browser execution and live typed-Project deletion verification are delegated
  to the integrating parent, against the combined application.

Coordinator review/integration: fixed DELETE client to use apiFetchVoid for successful 204 responses. Initial browser run passed 9 cases; all 3 previously failing deletion/focus cases now pass across Chromium, Firefox and WebKit. Root lint, typecheck and unit/integration suites passed; changed API client lint/typecheck passed after fix. Real-database HTTP probe passed 8 checks including typed Project cascade deletion and subsequent 404. Temporary records cleaned up. No staging or commits.
