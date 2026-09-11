# 07: Add Units across Storeys in batches, set their Unit Type, rename and delete them

**What to build:** The Units pane, headed by the selected Block and Storey, gains Add (single name into the selected Storey) and Add many. The Units batch form extends the shared form with a checkbox list of the Block's Storeys (selected Storey pre-ticked, select-all) and an optional Unit Type select; the preview shows the names and the total count (names times ticked Storeys) and marks names that already exist in any ticked Storey. Submitting creates every Unit in one transaction. Each Unit card shows name and Unit Type code and offers Edit (inline: name and Unit Type, where the type can be cleared) and Delete (a dialog naming the Unit).

Underneath: `POST /projects/:id/blocks/:blockId/units { storeyIds, names, unitTypeId? }`: 1 to 200 Storeys all belonging to that Block (else 404), 1 to 500 names, product capped at 2000, an optional Unit Type belonging to the Project (else 404), 409 `UNIT_NAME_TAKEN` with `details.names` listing each clashing name once. `PATCH /projects/:id/units/:unitId { name?, unitTypeId? }` with `null` clearing the type; `DELETE /projects/:id/units/:unitId`. Both resolve the Unit through the Project id. Positions are assigned per Storey.

Spec: `.scratch/projects/spec.md`. ADR-0005 applies to the Unit Type reference.

**Blocked by:** 06 (Add Storeys singly and in batches), 08 (Unit Types tab)

**Status:** ready-for-agent

- [ ] The add route creates names times Storeys Units in one transaction with per-Storey positions; 400 for batch validation failures and for exceeding the product cap; 404 for a Storey outside the Block or a Unit Type outside the Project; 409 `UNIT_NAME_TAKEN` listing clashes once each; covered at the HTTP seam
- [ ] Edit accepts name, Unit Type or both, clears the type on `null`, returns 409 on a sibling clash and 404 for a Unit or Unit Type of another Project; delete returns 204
- [ ] All three routes appear in the OpenAPI document
- [ ] The Units batch form shows the Storey checkboxes with select-all, the Unit Type select, the multiplied count, and markers against every ticked Storey; story and test beside it
- [ ] Unit cards show name and type code; inline edit changes name and type; delete works with the dialog and focus handling; in both locales
- [ ] The e2e fake implements the three routes and the e2e spec covers a batch into three ticked Storeys with a Unit Type, a clash in one of them blocking submit, a single add, editing a Unit's type, clearing it, rename and delete

## Comments
