# 01: Directory lists Subcontractors, paged

**What to build:** An Administrator who opens Subcontractors in the Console sees the Directory: a real table of every Subcontractor sorted by name, each row showing the company name, how many Members it has and their phone numbers, with page controls showing the current page, total pages and total count. An empty Directory says so and points at creating the first Subcontractor; a failed load shows an error with retry; a fetch shows a loading state. The placeholder "not built yet" is gone from this screen.

Underneath: the Subcontractor and Member concepts become persisted models in the `daedalus2` schema with a migration and a few seeded companies with Members for development. A guarded router under the versioned prefix exposes the paged list, with `page` defaulting to 1 and `pageSize` defaulting to 20 and capped at 100, and returns the new `meta` block beside `data`. The list is registered in the OpenAPI document. For the browser seam, an in-memory Subcontractor API fake is intercepted at the browser's edge beside the existing provider intercept, and the first Directory e2e spec drives the real screen against it.

Spec: `.scratch/subcontractors/spec.md`. ADR-0002, ADR-0003 and ADR-0004 apply.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Subcontractor and Member models exist with a migration; Member's Subcontractor reference deletes Members with the company; phone carries a unique constraint
- [x] Dev seed creates several Subcontractors, each with at least one Member
- [x] The list route refuses a request without a verified token (401) and is mounted so no Subcontractor route can be added unguarded
- [x] The list route returns rows (id, name, member count, phones) sorted by name with `meta { page, pageSize, total }`; paging defaults and the cap are enforced and covered at the HTTP seam with mocked Prisma and a signed test token
- [x] The list route appears in the OpenAPI document
- [x] The Directory replaces the placeholder: table with column headers, page controls, loading, empty and error-with-retry states, in both locales (zh-CN flagged as machine-translated)
- [x] Subcontractors stays the active sidebar entry on the Directory
- [x] A browser-edge fake for the Subcontractor API exists for e2e and the Directory e2e spec passes against it
- [x] New presentational components each have a story and a test beside them

## Comments

2026-09-10: Implementation complete and integrated. The `ready-for-agent`
triage label is retained; completion is recorded here separately. Evidence
below corresponds to acceptance criteria in their listed order.

1. [Database verification and deployment prerequisites](../../../docs/specs/0002-subcontractor-directory-verification.md#database-verification-and-deployment-prerequisites).
2. [Database verification and deployment prerequisites](../../../docs/specs/0002-subcontractor-directory-verification.md#database-verification-and-deployment-prerequisites).
3. [Stories 51–52: verified Session guards](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
4. [Stories 2–3 and 8: list HTTP/browser contracts](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
5. [Story 57: generated OpenAPI and list HTTP assertion](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
6. [Stories 1, 8, 10, 12–13, 44 and 48: Directory browser and semantic table](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
7. [Story 42: active navigation browser assertions](../../../docs/specs/0002-subcontractor-directory-verification.md#story-matrix).
8. [Story 59 and final frontend browser gate](../../../docs/specs/0002-subcontractor-directory-verification.md#combined-checks).
9. [Story 60 and seven-module presentation audit](../../../docs/specs/0002-subcontractor-directory-verification.md#presentation-and-locale-audit).

2026-09-10: Review. The empty Directory now carries a "Create the first subcontractor" link rather than a sentence in the not-built frame (story 10). Root lint failed on the gitignored Storybook output; ESLint now ignores build directories.
