# 06: Add Storeys singly and in batches, rename and delete them

**What to build:** The Storeys pane, headed by the selected Block, gains the same Add and Add many as Blocks: single inline add, the shared batch form with range and list modes, preview, existing and repeated markers, and all-or-nothing submission. Each Storey row has Rename and Delete (a dialog naming the Storey and its Unit count). Newly added Storeys appear in the order given after the existing ones.

Underneath: `POST /projects/:id/blocks/:blockId/storeys { names }` with the same batch rules and 409 `STOREY_NAME_TAKEN`; `PATCH /projects/:id/storeys/:storeyId { name }`; `DELETE /projects/:id/storeys/:storeyId`; every route resolving the Block or Storey through the Project id. Uniqueness is within the Block, so "01" may exist in every Block. Reuses the batch clash helper and `BatchNamesForm` from 05.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 05 (Add Blocks singly and in batches)

**Status:** ready-for-agent

- [ ] The add route creates the batch in one transaction with sequential positions within the Block; 400 for batch validation failures; 409 `STOREY_NAME_TAKEN` listing clashes; 404 for a Block of another Project; covered at the HTTP seam
- [ ] The same Storey name is accepted in two different Blocks
- [ ] Rename returns 409 on a sibling clash and 404 for a Storey of another Project; delete returns 204 and cascades to Units
- [ ] All three routes appear in the OpenAPI document
- [ ] The Storeys pane reuses `BatchNamesForm` with markers computed against the selected Block's Storeys; single add, rename and delete work in place, in both locales
- [ ] The e2e fake implements the three routes and the e2e spec covers a range batch into a Block, the same names into a second Block, a clash, rename and delete

## Comments
