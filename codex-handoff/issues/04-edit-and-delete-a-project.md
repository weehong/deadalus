# 04: Edit a Project's name or code, and delete it

**What to build:** From the Project screen's header actions, Edit opens an inline form in place of the heading with the name and code, under the same validation and uniqueness rules as creation; saving updates the heading and kicker in place. Delete opens a confirmation dialog naming the Project and its Block, Storey and Unit counts; confirming removes the Project and everything under it and returns to the list. The dialog is labelled, focus-trapped, closes on Escape and returns focus to the trigger.

Underneath: `PATCH /projects/:id { name?, code? }` (at least one) with the same 409s as creation, returning the full Project; `DELETE /projects/:id` cascading through Blocks, Storeys, Units and Unit Types, returning 204. Both registered in the OpenAPI document. Mutations write the returned Project into the cache and invalidate the list.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 03 (Open a Project's screen)

**Status:** ready-for-agent

- [ ] The edit route accepts name, code or both, rejects an empty body with 400, returns the full Project, and returns 409 `PROJECT_NAME_TAKEN` and `PROJECT_CODE_TAKEN`; 404 for an unknown id; covered at the HTTP seam
- [ ] The delete route returns 204 and cascades (the mocked Prisma call shape shows one delete on the Project; the migration's cascades are asserted by the schema); 404 for an unknown id
- [ ] Both routes appear in the OpenAPI document
- [ ] The inline edit form has field errors, busy state, Cancel, and maps the 409 codes to fields, in both locales
- [ ] The delete dialog names the Project and its counts, handles focus, and returns to the list on success
- [ ] The e2e fake implements edit and delete and the e2e spec covers rename, code change, taken name and code on edit, and delete with focus handling
- [ ] New components have a story and a test beside them

## Comments
