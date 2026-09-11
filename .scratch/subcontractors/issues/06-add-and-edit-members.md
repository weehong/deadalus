# 06: Add and edit Members

**What to build:** On a Subcontractor's screen an Administrator adds a Member by filling name and phone in an inline row at the foot of the Members table, and edits an existing Member's name or phone by turning that row into a form. Both fields are required; the phone accepts the same spoken forms as creation; a phone already belonging to a Member of another company is refused with the taken-phone message naming that company. Saved changes appear in the Members table and the Directory row's count and phones update.

Underneath: guarded add and edit routes nested under the Subcontractor, so a Member id belonging to a different Subcontractor answers 404, never a hit (ADR-0003). Edit requires at least one of name or phone. Both reuse the normaliser and the `MEMBER_PHONE_TAKEN` translation. Both registered in OpenAPI.

Spec: `.scratch/subcontractors/spec.md`.

**Blocked by:** 04 (Create a Subcontractor with its first Member)

**Status:** ready-for-agent

- [x] The add route returns 201 with the full Subcontractor; 400 on validation; 404 for an unknown Subcontractor; 409 `MEMBER_PHONE_TAKEN` with details; 401 without a token; covered at the HTTP seam
- [x] The edit route returns the full Subcontractor; 400 when neither field is present; 404 for a Member reached through the wrong Subcontractor; 409 `MEMBER_PHONE_TAKEN`; covered at the HTTP seam
- [x] Both routes appear in the OpenAPI document
- [x] Inline add row and inline edit row with field errors, busy state and Cancel, in both locales
- [x] Members table and Directory row reflect the change after success
- [x] The e2e fake implements add and edit with the 409 and the e2e spec covers adding, editing and the taken-phone message
- [x] New row-form components have a story and a test beside them

## Comments

2026-09-10: Implementation complete and integrated. The `ready-for-agent`
triage label is retained; completion is recorded here separately. Evidence
below corresponds to acceptance criteria in their listed order.

1. [Stories 31, 33, 52 and 56: add Member HTTP](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
2. [Stories 32–33, 53 and 56: partial/scoped edit HTTP](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
3. [Story 57: both Member write operations in OpenAPI](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
4. [Stories 31–32 and 44: inline Member form/browser tests](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
5. [Story 41: Member browser checks refreshed detail/count/phones](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
6. [Stories 31–33: Member browser/fake](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
7. [Story 60: MemberRowForm stories/test](../../../docs/specs/0002-subcontractor-directory-verification.md#presentation-and-locale-audit).
