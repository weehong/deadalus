# 06: Add Storeys singly and in batches, rename and delete them

**What to build:** The Storeys pane, headed by the selected Block, gains the same Add and Add many as Blocks: single inline add, the shared batch form with range and list modes, preview, existing and repeated markers, and all-or-nothing submission. Each Storey row has Rename and Delete (a dialog naming the Storey and its Unit count). Newly added Storeys appear in the order given after the existing ones.

Underneath: `POST /projects/:id/blocks/:blockId/storeys { names }` with the same batch rules and 409 `STOREY_NAME_TAKEN`; `PATCH /projects/:id/storeys/:storeyId { name }`; `DELETE /projects/:id/storeys/:storeyId`; every route resolving the Block or Storey through the Project id. Uniqueness is within the Block, so "01" may exist in every Block. Reuses the batch clash helper and `BatchNamesForm` from 05.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 05 (Add Blocks singly and in batches)

**Status:** complete

- [x] The add route creates the batch in one transaction with sequential positions within the Block; 400 for batch validation failures; 409 `STOREY_NAME_TAKEN` listing clashes; 404 for a Block of another Project; covered at the HTTP seam
- [x] The same Storey name is accepted in two different Blocks
- [x] Rename returns 409 on a sibling clash and 404 for a Storey of another Project; delete returns 204 and cascades to Units
- [x] All three routes appear in the OpenAPI document
- [x] The Storeys pane reuses `BatchNamesForm` with markers computed against the selected Block's Storeys; single add, rename and delete work in place, in both locales
- [x] The e2e fake implements the three routes and the e2e spec covers a range batch into a Block, the same names into a second Block, a clash, rename and delete

## Comments


### Implementation evidence (2026-09-11; awaiting integration review)

Implemented in isolated worktree `/tmp/daedalus-ticket-06` without staging or
committing. Storey create, rename and delete routes resolve ownership through
Block.projectId; create and rename reuse the shared serializable retry and clash
helpers. Add and rename return the complete Project; DELETE returns 204 and the
client uses apiFetchVoid, then refreshes Project queries. StoreysPane reuses
BatchNamesForm with only the selected Block's names and resets editing state on
Block changes. Both locale keys, Storybook examples, API fake and two browser
scenarios are present.

Targeted checks passed: 19 HTTP tests, 5 StoreysPane component tests (including
Chinese copy), backend and frontend typechecks, changed-source ESLint with zero
warnings, and git diff --check. HTTP coverage includes scoped 404s, same names in
two Blocks, batch limits/duplicates, all-or-nothing clash details, ordered
positions, rename/delete, authentication, OpenAPI, serializable retry and unique
race mapping. The shared batch helper and generator tests already passed in 05.

Parent integration review, combined verification, the two browser scenarios,
and live-database Storey concurrency/cascade verification remain pending; the
ticket is deliberately not marked complete before those checks.

Parent integration: standards/spec review complete; combined lint/typecheck/tests pass. All 6 browser cases pass across the three engines (one duplicated-word locator corrected, failing 3 rerun). Live database HTTP verification confirms concurrent disjoint batches preserve sequential positions, identical batches yield 201/409, sibling names reuse across Blocks, clash rollback, and Storey deletion cascades to Units.
