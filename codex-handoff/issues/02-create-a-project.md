# 02: Create a Project with a name and a code

**What to build:** An Administrator presses "New project" in the list's header row and fills a form with a name and a code. Both are required with field-level messages. The code is upper-cased as typed, allows only letters, digits and hyphens, and must be 2 to 12 characters; a bad code is rejected before submit. A taken name (compared without case or surrounding spaces) and a taken code are each reported on their field. Submit shows a busy state; a server failure shows inline with input intact; Cancel returns to the list. Success lands on the new Project's screen (which issue 03 builds; until then, landing on the route is enough).

Underneath: `POST /projects { name, code }` returns 201 with the full Project. The code transform (trim, upper-case, pattern) lives in the zod schema; the name key derives on every write. Unique violations translate to 409 `PROJECT_NAME_TAKEN` and `PROJECT_CODE_TAKEN`. The form uses react-hook-form with a zod resolver and the existing Field and Input primitives; the 409 codes map to field errors.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 01 (Projects list, paged and searchable)

**Status:** ready-for-agent

- [ ] The create route returns 201 with the full Project; 400 with field errors for a blank name, a blank code, or a code outside the pattern or length; 409 `PROJECT_NAME_TAKEN`; 409 `PROJECT_CODE_TAKEN`; 401 without a token; all covered at the HTTP seam
- [ ] The code is stored upper-cased and trimmed regardless of how it was typed
- [ ] The create route appears in the OpenAPI document
- [ ] The form at `/projects/new` has required fields with associated errors, live upper-casing of the code, busy state, inline server failure, Cancel, and lands on the new Project's route on success, in both locales
- [ ] The 409 codes map to field errors on name and code
- [ ] The e2e fake implements create with both 409s and the e2e spec covers the happy path, blank fields, a bad code, taken name and taken code
- [ ] New form components have a story and a test beside them

## Comments
