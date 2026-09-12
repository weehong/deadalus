# 10: Upload a Unit Matrix workbook and see the Blocks it holds

**What to build:** From the Structure tab of a Project, an Administrator presses "Upload Unit Matrix" (offered on the empty Blocks pane and in the tab's actions), lands on the Project's upload screen, picks the developer's `.xls` or `.xlsx` file, and after a busy state sees what the server found: a sheet select listing every sheet with its Block count, defaulting to the first with a Block, and a Block accordion, one Block open at a time, each header showing the Block's name, Storey and Unit counts, and stack range, and inside a read-only matrix of Storeys by Stacks with the Unit Type code in each cell, lowest Storey first. A file that is not a workbook, a wrong file type or an oversize file is refused with the reason shown inline and the file input intact. Nothing is created yet and the route keeps Projects as the active sidebar entry; no Session redirects to Sign in.

Underneath: SheetJS 0.20.3 as the pinned CDN tarball (ADR-0007) and `multer` with memory storage. The parse route takes one multipart file (10 MB cap, `.xls`/`.xlsx`), parses every sheet, stores nothing, and returns the Block shape from the spec. The detector in this ticket handles a plain grid: a header spanning two or more columns above a row of consecutive integers, the nearest labelled column to the left as the floor column (possibly shared by two Blocks), rows as floors until the label stops, cached formula values, a merged range as one cell at its top-left, numeric labels padded to two digits, Storeys ordered lowest first, Block names as header text with whitespace collapsed. Parser tests use synthesised workbooks built with SheetJS's writer and invented names. The browser-edge fake answers the parse route with a canned result for any file; Playwright uploads a tiny buffer.

Spec: `.scratch/projects/spec.md`, section "Unit Matrix upload". ADR-0007 applies.

**Blocked by:** 03 (Open a Project's screen)

**Status:** complete

- [x] SheetJS 0.20.3 is declared as the pinned CDN tarball with a comment naming ADR-0007; the lockfile carries its integrity hash; install and audit pass
- [x] The parser returns the Block shape for a single grid, two Blocks side by side sharing a floor column, a cell merged across two stacks (one code and a null), formula floor labels read from cached values, numeric labels padded and text labels kept, Storeys lowest first, and a sheet with no grid returning no Blocks; every fixture is synthesised in the test
- [x] The parse route refuses a request without a token (401), returns 404 for an unknown Project, 400 for a missing file, a `.csv` and a file over 10 MB, 400 `UNIT_MATRIX_UNREADABLE` for a text file named `.xlsx`, and 200 with every sheet for a valid workbook; covered at the HTTP seam with supertest `attach`; the route appears in the OpenAPI document
- [x] The upload action appears on the empty Blocks pane and in the Structure tab's actions and opens the upload route under the Project layout with Projects active in the sidebar
- [x] The screen shows a busy state while parsing, then the sheet select and the accordion with counts, stack range and the read-only matrix as a real table with row and column headers; parse failures show inline
- [x] The accordion and matrix are presentational components with a story and a test beside each
- [x] The e2e fake implements the parse route and the e2e spec covers upload, sheet switch, opening a second Block, a parse failure, the unauthenticated redirect and the phone-width layout with the table in its own horizontal scroll container
- [x] All copy exists in both locales, zh-CN flagged as machine-translated

## Comments

Implementation complete in isolated worktree; awaiting integration review. Targeted evidence: `../verification/ticket-10.md`. Audit remains at the recorded baseline of 15 advisories with zero new package/advisory pairs.

Coordinator review/integration: preserved Block controls while adding tab and empty-pane upload links. Root lint/typecheck/unit/integration checks pass; integrated upload + Blocks browser suite passes 18 cases across all three engines with normal workspace fonts. Frontend build passes. Dependency audit introduces zero advisories; the full audit remains nonzero on the recorded baseline findings. No staging or commits.
