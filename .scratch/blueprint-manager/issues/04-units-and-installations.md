# 04: Units screen, unit detail and installations

**What to build:** The Units sub-entry lists the units of a floor plan behind a plan selector. Opening a unit (from there or from the structure table) shows the unit screen: breadcrumb Structure / storey / floor plan / unit linking back into the structure screen at the right selection; a detail card with code, usable area, room tag count, ceiling height, entry door, boundary type, tenancy status, grid reference and "Edit unit"; an installations table (equipment and model, asset tag, location, installed date, state tag) with a summary line ("4 installed · 1 scheduled"), "Install equipment" opening a dialog (equipment, model, asset tag, location, installed date, state), edit and delete per row, duplicate asset tags rejected, and an empty state; and a sheet-reference card naming the floor plan's linked drawing with "Open drawing" (signed storage URL) or "No drawing linked".

**Blocked by:** 03 (Create, edit and delete storeys, floor plans and units)

**Status:** complete (Playwright coverage written; host browsers unavailable)

- [ ] Units route lists a floor plan's units with a plan selector; unit-by-id route renders the unit screen
- [ ] Breadcrumb links back to structure with storey/plan selection in the URL
- [ ] Unit detail card with the agreed fields and an Edit unit action reusing the unit dialog
- [ ] Installations table with summary, create/edit/delete dialogs, asset-tag uniqueness error, empty state
- [ ] Sheet-reference card: linked drawing name + Open drawing, or "No drawing linked"
- [ ] Unit tests: detail card, installations table, installation schema and dialog by props
- [ ] End-to-end (written): open unit from structure table; add installation sends insert and appears
- [ ] Strings in both locales; lint, typecheck, unit tests and build green
