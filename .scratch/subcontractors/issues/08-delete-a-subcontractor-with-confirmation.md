# 08: Delete a Subcontractor with confirmation

**What to build:** On a Subcontractor's screen an Administrator presses Delete in the header row and a dialog asks for confirmation, naming the company and how many Members will go with it. The dialog is labelled, traps focus, closes on Escape or Cancel, and returns focus to the Delete control. Confirming removes the company and its Members and returns the Administrator to the Directory, where the company is gone.

Underneath: a guarded delete route returning 204, 404 for an unknown id, cascading to Members through the database reference, registered in OpenAPI. A new Dialog UI primitive with a story and a test, since none exists. The check that refuses deletion while Assignments exist is a later feature and is not built here.

Spec: `.scratch/subcontractors/spec.md`.

**Blocked by:** 03 (Open a Subcontractor's screen)

**Status:** ready-for-agent

- [x] The delete route returns 204 and removes the Members with the company; 404 for an unknown id; 401 without a token; covered at the HTTP seam
- [x] The delete route appears in the OpenAPI document
- [x] A Dialog primitive exists with a story and a test: role dialog with an accessible name, focus moves in on open and back to the trigger on close, Escape closes
- [x] The confirmation names the company and its Member count, in both locales
- [x] Confirming returns to the Directory with the company absent
- [x] The e2e fake implements delete and the e2e spec covers confirmation, cancel with focus return, and the return to the Directory

## Comments

2026-09-10: Implementation complete and integrated. The `ready-for-agent`
triage label is retained; completion is recorded here separately. Evidence
below corresponds to acceptance criteria in their listed order.

1. [Stories 36/38/52: delete HTTP; actual Member cascade verification](../../../docs/specs/0002-subcontractor-directory-verification.md#database-verification-and-deployment-prerequisites).
2. [Story 57: delete OpenAPI](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
3. [Stories 47/50: Dialog component and browser focus/role tests](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
4. [Story 37: English singular/plural and Chinese browser checks](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
5. [Story 39: return to Directory, absent row and reload](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
6. [Stories 36–39 and 47: delete browser/fake and Cancel focus restoration](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).

2026-09-10: Review. `@headlessui/react`, used by the Dialog primitive, moved from devDependencies to dependencies.
