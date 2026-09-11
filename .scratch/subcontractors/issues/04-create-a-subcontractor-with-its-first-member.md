# 04: Create a Subcontractor with its first Member

**What to build:** An Administrator presses "New subcontractor" in the Directory's header row and fills a form with the company name, the first Member's name and the first Member's phone number. All three are required, with field-level messages. The phone can be typed as spoken, with or without spaces or +65; a number that cannot be valid is rejected before submit. A taken company name (compared without case or surrounding spaces) and a phone already belonging to a Member of another company are each reported on their field, the latter naming the other company. Submit shows a busy state; a server failure shows inline with input intact; Cancel returns to the Directory. Success lands on the new Subcontractor's screen.

Underneath: a pure server-side phone normaliser (strip separators, `00` to `+`, default +65, E.164 check) with a unit test, applied as a zod transform so the service only sees E.164. The Subcontractor gains a normalised name key carrying the unique constraint, derived on every write. A `conflict` (409) factory joins the shared HTTP error type. Creation is one transaction, so the "at least one Member" invariant holds at every instant. Unique-violation errors are translated into 409s with codes `SUBCONTRACTOR_NAME_TAKEN` and `MEMBER_PHONE_TAKEN` (the latter with the clashing company's id and name in details). The form uses react-hook-form with a zod resolver and the existing Field and Input primitives.

Spec: `.scratch/subcontractors/spec.md`. ADR-0003 applies to the route shape.

**Blocked by:** 03 (Open a Subcontractor's screen)

**Status:** ready-for-agent

- [x] The phone normaliser handles the input shapes in the spec and rejects non-E.164 results; unit-tested; +65 appears only there
- [x] The Subcontractor model carries a unique normalised name key; migration included
- [x] The create route returns 201 with the full Subcontractor; 400 with field errors for blank or invalid fields; 409 `SUBCONTRACTOR_NAME_TAKEN`; 409 `MEMBER_PHONE_TAKEN` with details; 401 without a token; all covered at the HTTP seam
- [x] Creation of the company and its first Member is one transaction
- [x] The create route appears in the OpenAPI document
- [x] The form at the `new` route has required fields with associated errors, busy state, inline server failure, Cancel, and lands on the new screen on success, in both locales
- [x] The 409 codes map to field errors on name and phone in the form
- [x] The e2e fake implements create with both 409s and the e2e spec covers the happy path, blank fields, a bad phone, taken name and taken phone
- [x] New form components have a story and a test beside them

## Comments

2026-09-10: Implementation complete and integrated. The `ready-for-agent`
triage label is retained; completion is recorded here separately. Evidence
below corresponds to acceptance criteria in their listed order.

1. [Stories 17–18 and 54: server normalizer/unit/HTTP; client plausibility only](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
2. [Story 21 and actual Unicode backfill/constraint checks](../../../docs/specs/0002-subcontractor-directory-verification.md#database-verification-and-deployment-prerequisites).
3. [Stories 16, 19–22, 52 and 56: create HTTP cases](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
4. [Story 55: nested atomic Prisma create and failed-write HTTP readback](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
5. [Story 57: create OpenAPI assertions](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
6. [Stories 15–18 and 22–25: component/browser form flows](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
7. [Stories 19–20: field conflict browser assertions](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
8. [Stories 16–22: create browser/fake scenarios](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
9. [Story 60: CreateSubcontractorForm stories/test](../../../docs/specs/0002-subcontractor-directory-verification.md#presentation-and-locale-audit).

2026-09-10: Review. The separate name-key backfill migration (ICU collation, UTF8 prerequisite) was folded into the table-creating migration; the e2e fake no longer imports backend source.
