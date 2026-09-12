# 03: Print QR labels for a whole Project

**What to build:** The print route from ticket 02, opened without `block`, prints every Block of the Project: the same sheets, one Block after another, each Block starting on a new page (`break-before: page`) with a short last page rather than the next Block filling it. The heading names the Project only and the count covers every Unit. A Project with no Units shows the empty message. A "Print QR labels" secondary button for the whole Project is added to the Structure tab beside its existing actions, linking to the route without `block`.

Spec: `.scratch/qr-labels/spec.md`. ADR-0010 applies.

**Blocked by:** 02

**Status:** complete

- [x] The Structure tab shows a Project-wide "Print QR labels" action linking to the print route with no `block`
- [x] Without `block`, every Block prints in Structure order, each on a new page, in Storey then Unit order within it
- [x] The heading and count reflect the whole Project; a Project with no Units shows the empty message
- [x] The Console e2e spec covers the action, the per-Block page break (asserted through the rendered structure) and the empty case
- [x] Typecheck, lint with zero warnings and the projects tests pass

## Comments

### Built — 2026-09-12

The same route without `block` prints every Block: `qrLabelBlocks` returns them
all in Structure order and the page renders one `QrLabelSheet` each, with
`.qr-sheet + .qr-sheet { break-before: page }` so each Block starts a new page
and a Block's last sheet is left short rather than shared. The heading names
the Project alone and the count covers every Unit. The Project-wide "Print QR
labels" link sits beside the Structure tab's existing upload action.

Verification: in `e2e/project-qr-labels.spec.ts`, the Project action's href and
landing, two sheets named "Block A labels, sheet 1" and "Block B labels, sheet
1" holding only their own labels, `break-before: page` present on the second
sheet and absent on the first, a Block with no Units contributing no sheet, and
a Project with no Units at all showing the empty message. The A4 geometry is
measured in the page: a 794 by 1123px sheet and a 250px column pitch (63.5mm
plus the 2.54mm gap), three labels to a row inside the 7.2mm margin.