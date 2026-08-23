# 03: Create, edit and delete storeys, floor plans and units

**What to build:** From the structure screen the Administrator creates a storey ("New storey" in the page heading), a floor plan ("Add floor plan" with a storey selected, or "+" on a storey row) and a unit ("Add unit" with a plan selected, or "+" on a plan row), each in a dialog with the agreed fields; edits any of them in the same dialog pre-filled ("Edit" on the detail card or a table row); and deletes any of them after a confirm that names it — refused with the reason shown when it still contains floor plans, units or installations. Field problems show against their field: required, duplicate storey number / plan code / unit code in this Site (from the mapped unique-violation), level to not above level from, negative areas or heights. The tree, detail and tables refresh after every change.

The entity dialog (headless dialog inside the blueprint frame, form library + schema validator as sign-in), the per-entity schemas mirroring the database constraints, and the pure provider-error mapping (unique → field error; restrict → blocked-delete; else generic alert) are built here and reused by 04 and 05.

**Blocked by:** 02 (Database schema and seed, and the Building structure screen (read))

**Status:** complete (Playwright coverage written; host browsers unavailable)

- [ ] Create/edit dialogs for storey, floor plan and unit with the agreed fields; edit pre-fills; submit calls the data module and invalidates
- [ ] Delete confirm names the item; blocked with inline reason when children exist; database restrict is also mapped to that message
- [ ] Schemas reject missing fields, level_to ≤ level_from, negative numbers; unique violations surface as field errors naming the field
- [ ] "+" on a tree row targets that row; page-heading and child-table actions open the right dialog
- [ ] Unit tests: each schema; dialog validation/submit/pre-fill by props; error mapping table; confirm blocked state
- [ ] End-to-end (written): create storey sends insert and tree shows it; edit sends update; delete of a storey with plans is blocked
- [ ] Strings in both locales; lint, typecheck, unit tests and build green
