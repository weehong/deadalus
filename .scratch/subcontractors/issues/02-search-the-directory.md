# 02: Search the Directory by company, Member name or phone

**What to build:** An Administrator types in a search box in the Directory's header row and, after a short pause, the table shows only the Subcontractors whose company name, any Member's name, or any Member's phone number matches. A phone search ignores spaces and a missing country code, so "9123 4567" finds "+6591234567". Searching always returns to the first page. A search with no matches says that nothing matched, distinct from the empty-Directory state.

Underneath: the list route accepts a trimmed `q`; the name and Member-name matches are case-insensitive substrings, and the phone match compares the digits of `q` against the digits of stored phones. The search input is debounced with the existing hook.

Spec: `.scratch/subcontractors/spec.md`.

**Blocked by:** 01 (Directory lists Subcontractors, paged)

**Status:** ready-for-agent

- [x] `q` matches company name, Member name (case-insensitive substring) and Member phone (digit substring); covered at the HTTP seam, including that the data layer receives the normalised form
- [x] The search box in the PageHeader actions slot is debounced and resets paging to page 1
- [x] A no-match state is shown and is distinct from the empty-Directory state, in both locales
- [x] The e2e fake implements search and the Directory e2e spec covers filtering, page reset and the no-match state
- [x] OpenAPI documents the `q` parameter

## Comments

2026-09-10: Implementation complete and integrated. The `ready-for-agent`
triage label is retained; completion is recorded here separately. Evidence
below corresponds to acceptance criteria in their listed order.

1. [Stories 4–6: search HTTP predicates observed through results](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
2. [Stories 7 and 9: debounce and paging browser checks](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
3. [Story 11: translated unmatched/empty states](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
4. [Stories 4–9 and 11: search browser suite](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
5. [Story 57: search q OpenAPI assertion](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
