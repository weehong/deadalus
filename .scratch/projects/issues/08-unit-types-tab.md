# 08: Manage the Project's Unit Types

**What to build:** The Unit Types tab becomes editable: an inline row form adds a Unit Type with a required code and an optional description, the code unique within the Project (compared upper-cased with all whitespace removed, so "BP2 (p)" and "bp2(p)" are one code; ADR-0006); each row offers Edit (inline) and Delete. Deleting a Unit Type that Units still use is refused with a message giving the count; deleting an unused one removes it after a confirmation. The table's Units column shows how many Units use each type.

Underneath: `POST /projects/:id/unit-types { code, description }` with 409 `UNIT_TYPE_CODE_TAKEN`; `PATCH /projects/:id/unit-types/:unitTypeId { code?, description? }`; `DELETE /projects/:id/unit-types/:unitTypeId` with 409 `UNIT_TYPE_IN_USE` and `details: { unitCount }` checked in the service before the database's `Restrict` would fire. All resolve the Unit Type through the Project id and return the full Project (204 for delete).

Spec: `.scratch/projects/spec.md`. ADR-0005 and ADR-0006 apply.

**Blocked by:** 03 (Open a Project's screen)

**Status:** complete

- [x] The add route returns 201 with the full Project; 400 for a blank code, a code over 40 characters or a description over 120; a description may be omitted or cleared; 409 `UNIT_TYPE_CODE_TAKEN` on a code differing only by case or any whitespace; 404 for an unknown Project; covered at the HTTP seam
- [x] The code-key helper (upper-case, remove all whitespace) is a pure function with a unit test
- [x] Edit accepts code, description or both with the same 409; 404 for a Unit Type of another Project
- [x] Delete returns 409 `UNIT_TYPE_IN_USE` with the count while any Unit references it, 204 otherwise
- [x] All three routes appear in the OpenAPI document
- [x] The tab's row form adds and edits with field errors and busy state; Delete shows the in-use refusal inline and a confirmation for an unused type; the Units column is correct; in both locales
- [x] The e2e fake implements the three routes and the e2e spec covers add, a taken code, edit, the in-use refusal and a successful delete
- [x] New components have a story and a test beside them

## Comments


2026-09-11 implementation evidence (awaiting parent integration and combined checks):

- Added guarded POST/PATCH/DELETE Unit Type routes with zod validation and OpenAPI registration. All writes use the shared code key and Project ownership boundary; add/edit return the full Project. Description omission preserves existing values on edit; null/blank clears it. Delete checks current Unit use and translates a concurrent Restrict failure into a 409 with a freshly queried count.
- Added the inline Unit Type form, table editing, deletion confirmation and inline in-use refusal, with typed en-US/zh-CN copy. Mutations write returned Projects into Query cache and invalidate affected queries; deletes use the bodyless response helper.
- TDD evidence: observed route 404/conflict 500 failures before implementation; missing form/dialog and missing inline editor failed before their implementations. Targeted HTTP suite: 21 passing; shared identity-key suite: 2 passing, extended Unicode whitespace and qualifier examples. Component suites: 8 passing across the form, table and dialog. Both new presentational components have stories.
- Chromium browser check: all 3 new scenarios passed (CRUD and normalized duplicate, concurrent in-use refusal, Chinese phone layout); the concurrency scenario was rerun successfully after adding count refresh and an assertion for the refreshed Units column. Browser used a temporary Vite-only config on port 5188 with intercepted API/auth. Shared worktree node_modules caused Vite font allow-list warnings; the parent integration browser run must exercise the normal workspace with fonts.
- Backend and frontend TypeScript checks passed; targeted backend and frontend ESLint passed with zero warnings. No staging, commits or pushes. Parent owns final review, integration, combined verification and completion status.

Parent integration: standards and acceptance criteria reviewed. Combined root lint, typecheck and tests pass; 21 Unit Types/detail browser cases pass across Chromium, Firefox and WebKit with normal workspace fonts.
