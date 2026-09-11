# 03: Open a Subcontractor's screen

**What to build:** An Administrator clicks a row in the Directory and lands on that Subcontractor's own screen: the company name as the heading with "Subcontractor" as the kicker, a table of its Members with name and phone, and a way back to the Directory. The Subcontractors sidebar entry stays active. Visiting the screen of a Subcontractor that no longer exists shows a not-found state with a way back rather than a crash. Without a Session, the URL sends the visitor to Sign in.

Underneath: a guarded read route returns the full Subcontractor with its Members sorted by name then phone, 404 for an unknown id, registered in OpenAPI. The screen lives at a child route of the guarded Console layout, keyed by id. The query hook for a single Subcontractor is introduced alongside the list hook under one key family.

Spec: `.scratch/subcontractors/spec.md`.

**Blocked by:** 01 (Directory lists Subcontractors, paged)

**Status:** ready-for-agent

- [x] The read route returns the full Subcontractor with sorted Members; 401 without a token; 404 for an unknown id; covered at the HTTP seam
- [x] The read route appears in the OpenAPI document
- [x] Directory rows link to the Subcontractor screen; the screen shows heading, kicker, Members table and a back link, in both locales
- [x] The sidebar marks Subcontractors active on the screen
- [x] A not-found state renders for an unknown id, with a way back
- [x] The unauthenticated redirect covers the new route
- [x] The e2e fake serves single Subcontractors and the e2e spec covers opening a row, the not-found state and the active sidebar entry

## Comments

2026-09-10: Implementation complete and integrated. The `ready-for-agent`
triage label is retained; completion is recorded here separately. Evidence
below corresponds to acceptance criteria in their listed order.

1. [Story 30: sorted detail HTTP; stories 40 and 52: 404/401](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
2. [Story 57: detail OpenAPI assertion](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
3. [Stories 26–27 and 30: translated detail browser flow](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
4. [Story 42: active detail navigation](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
5. [Story 40: not-found browser flow](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
6. [Story 51: direct detail redirect](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
7. [Stories 26–27, 40 and 42: detail browser/fake](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).

2026-09-10: Review. Directory rows were plain anchors that reloaded the document; they are router Links now. Members are ordered by the database in every response, not only the read route.
