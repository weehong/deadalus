# 08: Manage the Project's Unit Types

**What to build:** The Unit Types tab becomes editable: an inline row form adds a Unit Type with a required code and an optional description, the code unique within the Project (compared upper-cased with all whitespace removed, so "BP2 (p)" and "bp2(p)" are one code; ADR-0006); each row offers Edit (inline) and Delete. Deleting a Unit Type that Units still use is refused with a message giving the count; deleting an unused one removes it after a confirmation. The table's Units column shows how many Units use each type.

Underneath: `POST /projects/:id/unit-types { code, description }` with 409 `UNIT_TYPE_CODE_TAKEN`; `PATCH /projects/:id/unit-types/:unitTypeId { code?, description? }`; `DELETE /projects/:id/unit-types/:unitTypeId` with 409 `UNIT_TYPE_IN_USE` and `details: { unitCount }` checked in the service before the database's `Restrict` would fire. All resolve the Unit Type through the Project id and return the full Project (204 for delete).

Spec: `.scratch/projects/spec.md`. ADR-0005 and ADR-0006 apply.

**Blocked by:** 03 (Open a Project's screen)

**Status:** ready-for-agent

- [ ] The add route returns 201 with the full Project; 400 for a blank code, a code over 40 characters or a description over 120; a description may be omitted or cleared; 409 `UNIT_TYPE_CODE_TAKEN` on a code differing only by case or any whitespace; 404 for an unknown Project; covered at the HTTP seam
- [ ] The code-key helper (upper-case, remove all whitespace) is a pure function with a unit test
- [ ] Edit accepts code, description or both with the same 409; 404 for a Unit Type of another Project
- [ ] Delete returns 409 `UNIT_TYPE_IN_USE` with the count while any Unit references it, 204 otherwise
- [ ] All three routes appear in the OpenAPI document
- [ ] The tab's row form adds and edits with field errors and busy state; Delete shows the in-use refusal inline and a confirmation for an unused type; the Units column is correct; in both locales
- [ ] The e2e fake implements the three routes and the e2e spec covers add, a taken code, edit, the in-use refusal and a successful delete
- [ ] New components have a story and a test beside them

## Comments
