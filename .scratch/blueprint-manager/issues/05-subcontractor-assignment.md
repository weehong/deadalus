# 05: Subcontractors and scope assignment

**What to build:** The Subcontractors screen lists the Site's subcontractors (name, trade, item count) with add/edit/delete via a dialog (company name, trade, contact, phone, email, contract reference, default scope items A–F). Selecting one shows the building as a checklist — storey rows, floor-plan rows, unit rows with a tri-state box, and scope items A–F under each unit — where ticking an item saves immediately, ticking a unit assigns all its items (clearing if all were set), the first tick on a unit pre-ticks the subcontractor's default scope items, and other subcontractors holding an item are named beside it. "Expand all" and "Clear scope" act on the checklist. A scope sheet lists the selected subcontractor's items grouped by unit, and a coverage card shows Site-wide items covered, unassigned and double-assigned. Ticks are optimistic and revert with an alert on failure. Empty state when there are no subcontractors.

**Blocked by:** 03 (Create, edit and delete storeys, floor plans and units)

**Status:** complete (Playwright coverage written; host browsers unavailable)

- [ ] Subcontractor list with counts; add/edit/delete dialog with the agreed fields; email validated when present
- [ ] Checklist tree with tri-state unit boxes, per-item ticks, unit-level toggle, default-scope pre-tick on first tick, other holders shown, Expand all, Clear scope
- [ ] Scope sheet grouped by unit; coverage over the whole Site, labelled Site-wide
- [ ] Scope assignment writes are optimistic, invalidate on settle, revert with alert on failure
- [ ] Unit tests: tri-state derivation, tick callbacks, default pre-tick, scope sheet and coverage derivations, dialog schema
- [ ] End-to-end (written): tick sends insert, untick sends delete, coverage updates
- [ ] Strings in both locales; lint, typecheck, unit tests and build green
