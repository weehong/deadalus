# 13: Read the awkward layouts and show their warnings

**What to build:** The real developer schedules parse correctly and the preview says what was skipped. A workbook with several bands of Blocks, top-aligned in one band and bottom-aligned in another, yields every Block; floors with no Units (an empty floor 1, B1 and B2 rows) are left out and named in a warning; schematic and count rows below a Block are ignored; codes with glued qualifiers and trailing spaces come through trimmed; a partial top floor with blank cells mid-row keeps its filled cells; stacks starting above floor 1 are handled; a repeated floor label drops the later row with a warning; a Block whose stack numbers are not consecutive, or that has no stack row at all (columns numbered from 1), or that holds no Units is kept with a warning so the Administrator can decide. Each Block header on the upload screen shows its warning count and the open Block lists its warnings in words.

Underneath: warnings carry a stable code and are translated by the client. Every quirk gets its own synthesised workbook in the parser tests. The parser is then run by hand against the two real workbooks and the totals are recorded in this issue's comments; the files are never committed.

Spec: `.scratch/projects/spec.md`, section "Unit Matrix upload".

**Blocked by:** 10 (Upload a Unit Matrix workbook and see the Blocks it holds)

**Status:** ready-for-agent

- [ ] The parser handles, each with a synthesised fixture: three bands of Blocks with top- and bottom-aligned bands; an empty floor 1 and B1/B2 rows dropped with a warning naming the label; schematic and count rows below a Block ignored; glued `(p) (M)` and spaced `(p)`/`(d)` codes with trailing spaces trimmed; a partial top floor with blank cells mid-row; stacks starting above floor 1; a repeated floor label dropped with a warning; non-consecutive stack numbers warned; a missing stack row numbered from 1 with a warning; a Block with no Units kept with a warning
- [ ] Warnings carry stable codes documented in the OpenAPI response schema
- [ ] Block headers show a warning count and the open Block lists its warnings in translated words; the e2e fake's canned result includes warnings and the e2e spec asserts them
- [ ] The hand run against the two real workbooks yields 12 Blocks / 1193 Units and 4 Blocks / 638 Units, noted in the comments below
- [ ] All copy exists in both locales

## Comments
