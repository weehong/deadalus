# 05: Add Blocks singly and in batches, rename and delete them

**What to build:** The Blocks pane gains Add and Add many. Add is an inline single-name form. Add many opens the shared batch form: a Range mode (prefix, from, to, zero-pad width, suffix) or a List mode (one name per line), a live preview listing every name with the total count, markers on names that already exist in this Project and on names repeated in the input, and a submit disabled while any marker shows. Submitting creates the batch in one transaction and the pane shows the new Blocks in the order given. A server-side clash refuses the whole batch and shows the clashing names. Each Block row has Rename (inline, same uniqueness rule) and Delete (a dialog naming the Block and its Storey and Unit counts).

Underneath: `POST /projects/:id/blocks { names }` (1 to 500 names, duplicates within the batch a 400, existing names a 409 `BLOCK_NAME_TAKEN` with `details.names`), `PATCH /projects/:id/blocks/:blockId { name }`, `DELETE /projects/:id/blocks/:blockId`, all returning the full Project (204 for delete), all resolving the Block through the Project id (another Project's Block is a 404). Positions assigned as max + 1 in order inside the transaction. A batch clash helper shared by the three levels. The `BatchNamesForm` component and the pure name generator with its unit test are built here and reused by 06 and 07.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 03 (Open a Project's screen)

**Status:** ready-for-agent

- [ ] The add route creates the batch in one transaction with sequential positions; 400 for an empty list, over 500 names, a blank name or a repeated name; 409 `BLOCK_NAME_TAKEN` listing every clashing name as given; 404 for an unknown Project; 401 without a token; covered at the HTTP seam
- [ ] Rename returns 409 on a sibling clash and 404 for a Block of another Project; delete returns 204 and cascades
- [ ] All three routes appear in the OpenAPI document
- [ ] The name generator handles prefix, suffix, zero-padding, a reversed range and the list mode's trimming and blank-line dropping; unit-tested
- [ ] `BatchNamesForm` shows the live preview with count, marks existing and repeated names, disables submit while marked, shows a busy state and an inline server failure, in both locales; story and test beside it
- [ ] The single Add form creates one Block and clears; Rename and Delete work in place with the dialog naming counts and handling focus
- [ ] The e2e fake implements the three routes with the 409 and the e2e spec covers a single add, a range batch, a list batch, a marked clash blocking submit, a server clash message, rename and delete

## Comments
