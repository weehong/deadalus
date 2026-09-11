# 05: Rename a Subcontractor

**What to build:** On a Subcontractor's screen an Administrator presses Rename in the header row, edits the company name in place of the heading, and saves. A blank name is refused on the field; a name already used by another company (compared without case or surrounding spaces) is refused with the taken-name message. Cancel restores the heading. After a successful rename the screen and the Directory show the new name.

Underneath: a guarded rename route that re-derives the name key and applies the same 409 rule as creation, registered in OpenAPI. The mutation invalidates the Subcontractor's query and the list.

Spec: `.scratch/subcontractors/spec.md`.

**Blocked by:** 04 (Create a Subcontractor with its first Member)

**Status:** ready-for-agent

- [x] The rename route returns the full Subcontractor; 400 for a blank name; 409 `SUBCONTRACTOR_NAME_TAKEN`; 404 for an unknown id; 401 without a token; covered at the HTTP seam
- [x] The rename route appears in the OpenAPI document
- [x] Inline rename form with field error, Cancel and busy state, in both locales
- [x] Directory and screen reflect the new name after success
- [x] The e2e fake implements rename and the e2e spec covers a successful rename and the taken-name message

## Comments

2026-09-10: Implementation complete and integrated. The `ready-for-agent`
triage label is retained; completion is recorded here separately. Evidence
below corresponds to acceptance criteria in their listed order.

1. [Stories 28–29, 52 and 56: rename HTTP](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
2. [Story 57: rename OpenAPI](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
3. [Story 28: rename form component/browser cases and locale audit](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
4. [Story 41: rename heading and sorted Directory browser assertions](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
5. [Stories 28–29: rename browser/fake](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
