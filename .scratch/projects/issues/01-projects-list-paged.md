# 01: Projects list, paged and searchable

**What to build:** An Administrator who opens Projects in the Console sees a real table of every Project sorted by name, each row showing the code, the name and the Block, Storey and Unit counts, with page controls showing the current page, total pages and total count, and a search box matching name or code that resets to page 1. An empty list says so and points at creating the first Project; a search with no matches says nothing matched; a failed load shows an error with retry; a fetch shows a loading state. The placeholder "not built yet" is gone from this screen.

Underneath: Project, Block, Storey, Unit and UnitType become persisted models in the `daedalus2` schema with one migration (unique name key and unique code on Project; unique (parent, nameKey) at each level; positions; cascades from Project down to Unit; `Restrict` on the Unit's Unit Type reference) and a seeded Project with a few Blocks, Storeys, Units and Unit Types for development. The Subcontractor name-key helper moves to a shared `name-key` module. A guarded router under the versioned prefix exposes the paged list with `page`, `pageSize` (default 20, cap 100), `q`, and the `meta` block, registered in the OpenAPI document. For the browser seam, an in-memory Projects API fake is intercepted at the browser's edge beside the Subcontractor fake, and the first Projects e2e spec drives the real screen against it. The route file `projects.ts` becomes `projects.index.ts`.

Spec: `.scratch/projects/spec.md`. ADR-0002, ADR-0004 and ADR-0005 apply.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The five models exist with a migration; uniqueness, positions and cascade rules match the spec; the Unit's Unit Type reference restricts deletion; the Unit Type description column is nullable and the code key is derived with all whitespace removed (ADR-0006)
- [ ] The name-key helper lives in a shared module, is unit-tested, and Subcontractor uses it from there
- [ ] Dev seed creates one Project with Blocks, Storeys, Units and Unit Types using fixed ids
- [ ] The list route refuses a request without a verified token (401) and is mounted so no Project route can be added unguarded
- [ ] The list route returns rows (id, code, name, blockCount, storeyCount, unitCount) sorted by name key, matches `q` against name or code, and returns `meta { page, pageSize, total }`; paging defaults and the cap are covered at the HTTP seam with mocked Prisma and a signed test token
- [ ] The list route appears in the OpenAPI document
- [ ] The Projects screen replaces the placeholder: table with column headers, debounced search, page controls, loading, empty, no-match and error-with-retry states, in both locales (zh-CN flagged as machine-translated)
- [ ] Projects stays the active sidebar entry on the list
- [ ] A browser-edge fake for the Projects API exists for e2e and the list e2e spec passes against it, including search and paging
- [ ] New presentational components each have a story and a test beside them

## Comments
