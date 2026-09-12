# Real workbook layouts, as read on 2026-09-11

These findings drove the detection rules in the spec's "Unit Matrix upload"
section and the fixtures in tickets 10 and 13. They are recorded here because
the real files must never enter the repository. The files live on the user's
machine only; ask the user for the path when a hand run is needed.
Postal codes and other identifying details are omitted.

## Workbook A: "Unit Matrix" (.xls, BIFF8), 12 towers, 1193 Units

- One sheet holds all 12 towers as 3 horizontal bands of 4 towers. A second
  sheet repeats the grid with every ` (M)` suffix removed and the grid
  shifted two or three columns right; both sheets should be detected.
- Per tower: a name row (text merged across the tower's stack columns, e.g.
  `1 TAMPINES STREET 62  (TOWER 3)` with a double space), a postal row
  (numeric, once misplaced by a few columns), a blank row, a row of global
  stack numbers (1 to 114 continuous across all towers), a blank row, then
  floor rows top-down with the floor number in the column immediately left
  of the first stack column, then a floor `1` row with no unit cells, then
  `B1` (and `B2` for one tower) text rows with no unit cells, a blank row,
  a two-row "floor-plate schematic" of type codes (not floor data), and a
  row holding a number immediately left of a cell reading `UNITS`.
- Floor labels are stored as floats (12.0). Band 1 is top-aligned (an
  11-storey tower leaves a blank row at the bottom of the band); band 2 is
  bottom-aligned. Row position never gives the floor; the label does.
- Cells are Unit Type codes only: `BP2`, `BP2(p)`, `BP2 (M)`, `BP2(p) (M)`.
  `(p)` is glued and lower-case (PES unit, on floor 2, the lowest unit
  floor); ` (M)` is spaced and upper-case (mirrored). Sheet 2 leaves
  trailing spaces where `(M)` was removed, inconsistently.
- A stack can change type family on floor 2 (e.g. `BPS1` above, `AS2 (M)`
  on 2). Two towers have a partial top floor: floor 8 has 5 or 4 filled
  cells with blank cells between them. Blank means no unit.
- No merged cells inside grids, no duplexes, no penthouse, no roof rows.
- Cells carry a background fill per type family; not used by the parser.
- Below the grids: a category list with stale duplicate rows and a wrong
  sum, family group labels, and a type-by-block count matrix. Not parsed.
- 82 distinct cell strings. Per-tower counts 121, 132, 108, 121, 59, 58,
  99 ×6. Towers are ordered 3,2,1,12 / 4,6,5,11 / 10,9,8,7 in the grid.

## Workbook B: "Unit Distribution" (.xlsx), 4 blocks, 638 Units

- Sheet `Unit Matrix`: rows 1 to 3 hold a company name, a title and a note.
  Blocks 1 and 2 sit side by side (columns C to J and L to S) sharing the
  floor-label column A; Blocks 3 and 4 the same lower down. Column B is a
  narrow spacer, column K a gap.
- Block header `Block 1` merged across its stack columns. Stack numbers
  (global 1 to 32) sit in cells merged vertically over two rows, with the
  labels `Unit` and `Flr` in column A beside them.
- Floor labels are formulas (`=SUM(A11,1)`) chained upward from a literal
  `1` at the bottom row; read cached values.
- Codes: `C1`, `C1 (p)`, `C1 (d)`, `PH`. ` (p)` spaced on floor 1 (PES),
  ` (d)` spaced on a stack's top storey. Stack type is otherwise constant.
- `PH` on the top floor is merged horizontally across two stacks (5+6 and
  15+16); the sheet counts it as one unit. The only in-grid merge.
- Several stacks start at floor 2 or 3 (blank bordered cells below). Block
  3 has a 21st floor that only six of its eight stacks reach; Block 4's row
  at that height is entirely empty.
- No basement rows, no empty floor 1. Blank means no unit.
- Rows 58 to 83 hold a legend: code, short category (`1BR+S`), level
  (`1`, `typical sty`, `top most sty`), and a COUNTIF total. Not parsed.
- Sheet `Rooms Tabulation` is a per-type room schedule driven by formulas;
  it holds no Blocks and must yield zero detected Blocks.
- Block totals 158, 158, 165, 157.

## PDFs (not parsed; context only)

- A one-page chart for the same development as Workbook B, identical grid.
- A six-block development from 2017: block plans carry only type codes, no
  storey or unit numbers; the site sections show 14- and 15-storey blocks,
  a `-PH` suffix on every top-floor code, two blocks whose "1st storey" sits
  a level above the others', and carpark levels named under each block.
  None of that changes the model: storeys are per Block, empty levels are
  skipped, qualifiers are part of the code.

## Implications the spec already encodes

- Detect a Block by a text cell spanning two or more columns followed
  within four rows by a row of consecutive integers.
- The floor column is the nearest labelled column to the left; it may be
  shared by two Blocks.
- Stop at the first row whose floor label is empty; that skips schematic
  and count rows.
- Blank cells mid-row are legitimate; never treat the first blank as end of
  column.
- Trim and collapse whitespace; the code key removes all whitespace.
- A Storey with no filled cell is dropped with a warning.
- Storeys come out lowest first by reversing row order, without parsing
  labels, so `B1`, `01`, `02` need no numeric sort.
