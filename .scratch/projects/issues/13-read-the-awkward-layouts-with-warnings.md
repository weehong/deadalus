# 13: Read the awkward layouts and show their warnings

**What to build:** The real developer schedules parse correctly and the preview says what was skipped. A workbook with several bands of Blocks, top-aligned in one band and bottom-aligned in another, yields every Block; floors with no Units (an empty floor 1, B1 and B2 rows) are left out and named in a warning; schematic and count rows below a Block are ignored; codes with glued qualifiers and trailing spaces come through trimmed; a partial top floor with blank cells mid-row keeps its filled cells; stacks starting above floor 1 are handled; a repeated floor label drops the later row with a warning; a Block whose stack numbers are not consecutive, or that has no stack row at all (columns numbered from 1), or that holds no Units is kept with a warning so the Administrator can decide. Each Block header on the upload screen shows its warning count and the open Block lists its warnings in words.

Underneath: warnings carry a stable code and are translated by the client. Every quirk gets its own synthesised workbook in the parser tests. The parser is then run by hand against the two real workbooks and the totals are recorded in this issue's comments; the files are never committed.

Spec: `.scratch/projects/spec.md`, section "Unit Matrix upload".

**Blocked by:** 10 (Upload a Unit Matrix workbook and see the Blocks it holds)

**Status:** complete

- [x] The parser handles, each with a synthesised fixture: three bands of Blocks with top- and bottom-aligned bands; an empty floor 1 and B1/B2 rows dropped with a warning naming the label; schematic and count rows below a Block ignored; glued `(p) (M)` and spaced `(p)`/`(d)` codes with trailing spaces trimmed; a partial top floor with blank cells mid-row; stacks starting above floor 1; a repeated floor label dropped with a warning; non-consecutive stack numbers warned; a missing stack row numbered from 1 with a warning; a Block with no Units kept with a warning
- [x] Warnings carry stable codes documented in the OpenAPI response schema
- [x] Block headers show a warning count and the open Block lists its warnings in translated words; the e2e fake's canned result includes warnings and the e2e spec asserts them
- [x] The hand run against the two real workbooks yields 12 Blocks / 1193 Units and 4 Blocks / 638 Units, noted in the comments below
- [x] All copy exists in both locales

## Comments


### Implementation and verification — 2026-09-11

Implemented in the isolated ticket 13 workspace; awaiting main-agent review,
integration and combined browser execution before marking done.

The parser now reads delayed bottom-aligned Blocks, ignores the `Unit`/`Flr`
metadata beside vertically merged Stacks, retains irregular or inferred Stacks
with warnings, drops empty/repeated Storeys, and normalizes Storey identity with
the shared name key. It retains cached formula values, merged Units and sparse
cells. Header candidates must have empty neighbours when unmerged, which prevents
a final Unit cell above a count legend being detected as a Block. Existing cell,
dimension and merge bounds remain; delayed-label searches have a cumulative
10-million-lookup limit per sheet.

Warnings expose five stable OpenAPI enum codes (`EMPTY_STOREY`,
`DUPLICATE_STOREY`, `NON_CONSECUTIVE_STACKS`, `INFERRED_STACKS`, `EMPTY_BLOCK`) and
an optional original `label`. The client translates the code with that label;
it never parses or renders server English messages. Warning counts have singular
and plural English copy and Chinese copy. Expanded Blocks list translated
warnings; the Storybook example, browser fake and browser assertions include them.

Targeted evidence:

- Backend: 18 synthesized parser tests and 10 multipart HTTP/OpenAPI tests passed.
  Every requested layout has a synthesized fixture; none contains original file data.
- Backend and frontend TypeScript checks passed. Targeted source ESLint checks
  passed with zero warnings. E2E files are excluded by the repo ESLint config;
  they are covered by frontend TypeScript.
- Frontend: 3 accordion tests passed, including Chinese code-based warning
  rendering and proof that English server prose is not displayed. The existing
  matrix test and 10 i18n tests also passed.
- Browser warning assertions are written and typechecked; execution is assigned
  to the integrating agent's combined browser checks.

### Original workbook hand run

Read directly from the original user-supplied paths below. The restored sibling
workbook was excluded. Neither original was copied into the repository, fixtures,
or workspace; parsing keeps buffers in memory and does not persist uploads.

| Original | Sheet name (spaces preserved in command output) | Blocks | Units | Warnings |
| --- | --- | ---: | ---: | ---: |
| Tampines Resi - Unit Matrix 20241127.xls | `20241127 witn mirrored units ` | 12 | 1193 | 25 |
| Tampines Resi - Unit Matrix 20241127.xls | `20241127 no mirrored units  ` | 12 | 1193 | 25 |
| JT - Unit Distribution (UTC).xlsx | `Unit Matrix` | 4 | 638 | 1 |
| JT - Unit Distribution (UTC).xlsx | `Rooms Tabulation` | 0 | 0 | 0 |

Both Tampines sheets yield per-Block Unit totals
`121, 132, 108, 121, 59, 58, 99, 99, 99, 99, 99, 99` in workbook order.
All 12 Blocks warn for empty `1` and `B1`; the fourth also warns for `B2`.
The mirrored and non-mirrored sheets are alternative previews, not additive totals.
JT yields `158, 158, 165, 157`; its fourth Block warns for empty `21`.

Reproduce from `apps/backend` (no workbook is written):

```sh
node_modules/.bin/tsx -e '
import { readFileSync } from "node:fs";
import { parseUnitMatrix } from "./src/services/unit-matrix.ts";
for (const path of [
  "/mnt/d/Downloads/Daedalus/Tampines Resi - Unit Matrix 20241127.xls",
  "/mnt/d/Downloads/Daedalus/JT - Unit Distribution (UTC).xlsx"
]) {
  const preview = parseUnitMatrix(readFileSync(path));
  console.log(JSON.stringify({file:path,sheets:preview.sheets.map(sheet => ({
    name:sheet.name,
    blocks:sheet.blocks.length,
    units:sheet.blocks.reduce((sum,block) => sum + block.unitCount,0),
    totals:sheet.blocks.map(block => block.unitCount),
    warningCount:sheet.blocks.reduce((sum,block) => sum + block.warnings.length,0)
  }))}));
}'
```

### Approved ticket versus older spec wording

Ticket 13 explicitly retains a Block whose stack row is missing and numbers its
columns from 1, while the older spec detection step 9 rejects that header. The
specific approved ticket governs this implementation. Inference is deliberately
conservative: a merged header bounds at least two columns, and two adjacent
recognizable Storey labels and populated type-code rows must appear within four
rows. Notes and legends without that evidence are not inferred.

The originals also have one alignment spacer between their last filled Storey
and empty ground/basement labels. The parser still ends Unit-bearing data at that
spacer; it permits only the immediately following empty labelled tail to produce
warnings. It never resumes filled rows after the spacer, so schematic and count
rows remain excluded. These clarifications are recorded here without modifying
the approved spec or domain documents.

Parent integration: standards/spec review complete. Combined root lint/typecheck/tests pass and all 12 upload browser cases pass across Chromium, Firefox and WebKit. Authenticated multipart HTTP hand run on original files reproduces both Tampines sheets: 12 Blocks / 1193 Units / 25 warnings and JT Unit Matrix: 4 Blocks / 638 Units / 1 warning. Database counts confirm parsing persists no Blocks or Unit Types.
