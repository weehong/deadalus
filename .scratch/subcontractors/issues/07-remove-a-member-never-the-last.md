# 07: Remove a Member, never the last one

**What to build:** On a Subcontractor's screen each Member row has a Remove action. Removing a Member takes them out of the table and the Directory row's count and phones update. Removing the only Member is refused with a message explaining that a Subcontractor must keep at least one Member; the Member stays.

Underneath: a guarded remove route nested under the Subcontractor, 404 for a Member reached through the wrong Subcontractor, 409 with code `LAST_MEMBER` when the Member is the company's only one, 204 otherwise. Registered in OpenAPI.

Spec: `.scratch/subcontractors/spec.md`. ADR-0003 applies to the route shape.

**Blocked by:** 03 (Open a Subcontractor's screen)

**Status:** ready-for-agent

- [x] The remove route returns 204; 404 for an unknown Subcontractor or a Member reached through the wrong Subcontractor; 409 `LAST_MEMBER` for the only Member; 401 without a token; covered at the HTTP seam
- [x] The remove route appears in the OpenAPI document
- [x] Remove action per Member row; the `LAST_MEMBER` refusal is shown as an explanation, in both locales
- [x] Members table and Directory row reflect the removal after success
- [x] The e2e fake implements removal with the last-Member rule and the e2e spec covers a removal and the refusal

## Comments

2026-09-10: Implementation complete and integrated. The `ready-for-agent`
triage label is retained; completion is recorded here separately. Evidence
below corresponds to acceptance criteria in their listed order.

1. [Stories 34–35, 52–53 and 56: scoped removal HTTP and concurrency model](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
2. [Story 57: removal OpenAPI](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
3. [Story 35: retained final Member and translated explanation](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
4. [Story 41: removal browser checks count and phones](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
5. [Stories 34–35: removal browser/fake](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
