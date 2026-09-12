# Ticket 14 — Unit Matrix upload verification

Checked 2026-09-11; final integrated verification 2026-09-12. All approved stories 50–62 have verification below. This record
reuses reviewed results from tickets 10–13 and the integration owner rather than
rerunning unchanged suites. Final combined repository checks passed after
documentation integration; results are recorded below.

## Story matrix

Paths below are relative to the repository root. HTTP tests exercise Express,
validation and token verification with mocked Prisma; browser specs use a fake
Projects API. The separate live checks below exercise the actual configured
database and original workbook buffers.

| Story | Required behavior | Verification |
| --- | --- | --- |
| 50 | Upload action for an empty Project | `apps/frontend/e2e/unit-matrix-upload.spec.ts` opens it from Structure; `structure-commit.spec.ts` checks the action is disabled after commit and shows the populated-Project refusal. |
| 51 | Read the original `.xls` and `.xlsx` | `apps/backend/tests/unit/unit-matrix.test.ts` synthesizes both BIFF8 and XLSX. Direct parser and authenticated multipart runs on both originals reproduce the totals below. |
| 52 | Block name, Storey/Unit counts and Stack range | `UnitMatrixAccordion.test.tsx` under `apps/frontend/src/features/projects/` checks counts, ranges and one-open-Block behavior; `unit-matrix-upload.spec.ts` checks the preview. |
| 53 | Sheet choice, default first sheet with Blocks | `unit-matrix-upload.spec.ts` starts with a Notes sheet, defaults to the first grid, then switches sheets. `unit-matrix-editor.spec.ts` verifies edits survive sheet changes. |
| 54 | Rename and include/exclude Blocks | `structure-commit.spec.ts` checks normalized duplicate/blank headers and sends only included renamed Blocks; `matrix-to-structure.test.ts` covers ignored excluded names. |
| 55 | Correct cells, Storeys and Stacks | `UnitMatrixEditor.test.tsx` covers controlled cell clearing, Storey naming and keyboard insertion/removal; `unit-matrix-editor.spec.ts` exercises row/column edits through corrected commit, invalid names and duplicate Units. |
| 56 | Show translated warnings and new Type codes | `UnitMatrixAccordion.test.tsx` verifies stable-code English/Chinese warnings and excludes server English prose. `unit-matrix-upload.spec.ts` checks visible warnings; `unit-matrix-editor.spec.ts` checks deduplicated new codes update after edits. |
| 57 | Refuse hard errors and populated Projects | `apps/backend/tests/integration/structure.route.test.ts` covers names, duplicate sibling details, payload caps, 404 and 409. Editor/commit browser specs show hard errors, disabled Commit, busy state and racing 409. Live database races verify the empty gate inside the transaction. |
| 58 | Atomically commit and show counts on Structure | `structure.route.test.ts` verifies ordering, Type reuse, bounded writes and retry; `structure-commit.spec.ts` verifies summary navigation and immutable import counts after manual changes. Actual database commit verifies the full 10,000-Unit payload and competing writes. |
| 59 | Omit empty Storeys and count merged cells once | Parser tests cover floor 1/B1/B2 omission, merged PH cells and their null followers. `matrix-to-structure.test.ts` verifies one Unit per filled cell and edited-empty Storey omission; `unit-matrix-editor.spec.ts` checks immutable omitted Storey labels in the summary. Original totals also match. |
| 60 | Reject unreadable files with a reason | `unit-matrix.route.test.ts` checks wrong extension, missing/oversize file and disguised text; parser tests reject sparse malicious dimensions. `unit-matrix-upload.spec.ts` checks pending/error copy while retaining the selected file. |
| 61 | Synthetic fixtures for real layout quirks | All 18 parser cases in `unit-matrix.test.ts` build workbooks in memory. They cover three bands, bottom alignment, empty/repeated floors, ignored legends, qualifiers, partial floors, raised Stacks, inferred/irregular Stacks and empty Blocks. No developer workbook is checked in. |
| 62 | Document and exercise both HTTP contracts | `unit-matrix.route.test.ts` and `structure.route.test.ts` cover both guarded routes and OpenAPI. `check-upload-contract.mjs` additionally requests the actual `/openapi.json` and checks multipart binary input, nested JSON limits, security, response shapes and warning enum/labels. |

## Direct checks for this ticket

From `apps/backend`, run:

```sh
node --env-file=.env --import tsx ../../.scratch/projects/verification/check-upload-contract.mjs
```

Passed against the actual Express application. It checks both OpenAPI operations
without authentication or database writes. The same read-only script verifies all
59 `projects.upload` leaves in en-US have non-empty zh-CN values, identical
interpolation fields and the existing machine-translation/native-review flag.
This verifies coverage, not the linguistic quality of the Chinese translation.
The Projects-wide locale verification belongs to ticket 09.

OpenAPI exposes the schemas' representable constraints. Duplicate sibling
identity and the total across all Unit arrays are Zod runtime refinements;
the generated schema alone does not express those rules. HTTP tests exercise
them, and README/SPEC document them.

## Recorded integrated evidence

- After ticket 13: root lint, typecheck and tests pass; 12 upload browser cases
  pass across Chromium, Firefox and WebKit. Both original files also pass through
  authenticated multipart HTTP, with unchanged database Block/Unit Type counts.
- After ticket 11: root checks and 21 upload/commit browser cases pass. Actual
  database checks verify existing Type reuse, refusal of a populated Project,
  simultaneous commits yielding 201/409, concurrent Type insertion and a
  10,000-Unit Unicode payload of 3,182,445 bytes, completed in 3340 ms.
- After ticket 12: root checks and all 30 editor/upload/commit browser cases pass
  across all three browsers with normal workspace fonts. The earlier isolated
  worktree font limitation is resolved by these integrated runs.
- Source details and targeted counts are recorded in [ticket 10](ticket-10.md),
  [ticket 11](ticket-11.md), [ticket 12](ticket-12.md),
  [ticket 13's comments](../issues/13-read-the-awkward-layouts-with-warnings.md)
  and [prerequisites](prerequisites.md). Temporary live-check Projects were cleaned
  up; existing data was preserved.

## Original workbook evidence

Only these source files were read; the restored sibling workbook was excluded.
No source workbook was copied into the repository. Results below come from both
direct parser execution and authenticated multipart HTTP, not browser fixtures.

| Source path | Sheet | Blocks | Units | Warnings |
| --- | --- | ---: | ---: | ---: |
| `/mnt/d/Downloads/Daedalus/Tampines Resi - Unit Matrix 20241127.xls` | `20241127 witn mirrored units ` | 12 | 1193 | 25 |
| Same source | `20241127 no mirrored units  ` | 12 | 1193 | 25 |
| `/mnt/d/Downloads/Daedalus/JT - Unit Distribution (UTC).xlsx` | `Unit Matrix` | 4 | 638 | 1 |
| Same source | `Rooms Tabulation` | 0 | 0 | 0 |

Tampines' sheets are alternatives, not additive totals. Its per-Block Unit counts
are `121, 132, 108, 121, 59, 58, 99, 99, 99, 99, 99, 99`; JT's are
`158, 158, 165, 157`. Ticket 13 records a reproducible non-persisting parser command.

## Documentation and limits

README describes the built upload workflow and API; SPEC section 17 records its
implementation and explicitly identifies ticket 13's conservative missing-Stack
inference as a clarification of the older generic rejection rule. CONTEXT's
Structure/Stack/Unit Matrix/Unit Type definitions match the implementation.
ADR-0006 matches qualifier retention, normalized code identity and first-spelling
reuse. ADR-0007 matches the pinned server-only SheetJS CDN dependency and lockfile
integrity. No domain change is required; unrelated Item/Progression edits remain
untouched. Approved handoff snapshots remain unchanged.

Dependency audit retains 15 pre-existing advisories, with no new package/advisory
pairs from upload dependencies; see the [separate follow-up](../../dependency-audit/follow-up.md).
`simplify` and `run` were not runtime-discoverable in Codex, so direct complexity
review and application/browser execution were used. Claude Code runtime discovery
and the distinction from filesystem evidence are recorded in prerequisites.
Preview drafts are not durable across page closure, importing revisions into a
populated Project is outside scope, and native Chinese review remains outstanding.

## Final combined verification

Passed in the main workspace on 2026-09-12: root build, lint, typecheck and tests
(backend 378 unit/integration tests; frontend 155 unit/component tests), backend
Playwright 2 cases, and the full frontend Playwright suite 288 cases across
Chromium, Firefox and WebKit. The final browser run completed in 2.1 minutes.
[Ticket 09](ticket-09.md#final-combined-verification--2026-09-12) records commands,
local log paths, the repaired browser test assumptions and the clean rerun.

Documentation and implementation are reviewed and integrated. Repository checks
confirm unchanged handoff artifacts, no copied source workbooks, no staged
changes and a clean `git diff --check`. All stories 50–62 and this ticket's
acceptance criteria are complete.
