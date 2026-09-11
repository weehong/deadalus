# 11: Commit the previewed Blocks into an empty Project

**What to build:** On the upload screen, each Block header gains an editable name and an include tick, and the screen gains Commit. Pressing Commit creates every ticked Block with its Storeys and Units, and every Unit Type whose code the Project does not yet hold, in one go, then lands on the Structure tab with the first Block selected and a summary line of the counts created. A Project that already has Blocks refuses the commit with a message naming the count, and its "Upload Unit Matrix" action is disabled with a hint to delete the Blocks first. Duplicate or blank Block names are shown against the header and disable Commit.

Underneath: the commit route takes the Structure shape from the spec (Blocks with Storeys with Units carrying an optional Unit Type code), validates the caps (50 Blocks, 10,000 Units, name and code lengths, no duplicate sibling name keys, reported under `details`), returns 409 `PROJECT_HAS_BLOCKS` with the Block count when any Block exists, and otherwise creates the missing Unit Types by code key (code as first seen, no description), then the Blocks, Storeys and Units with positions in array order, in one transaction, returning 201 with the full Project. Existing Unit Types are reused by code key. The client converts the matrix to that shape with a pure function: one Unit per filled cell, named by its Stack, with the cell's code; a null cell yields no Unit. The mutation writes the returned Project into the cache and invalidates the list.

Spec: `.scratch/projects/spec.md`, section "Unit Matrix upload". ADR-0005 and ADR-0006 apply.

**Blocked by:** 08 (Manage the Project's Unit Types), 10 (Upload a Unit Matrix workbook and see the Blocks it holds)

**Status:** ready-for-agent

- [ ] The commit route refuses a request without a token (401), returns 404 for an unknown Project, 409 `PROJECT_HAS_BLOCKS` with the count when any Block exists, and 400 for an empty Blocks array, more than 50 Blocks, more than 10,000 Units, a blank or over-long name or code, and duplicate sibling names at each level with the duplicates under `details`
- [ ] A valid body creates every Unit Type, Block, Storey and Unit in one transaction with positions in array order and returns 201 with the full Project; a code matching an existing Unit Type by code key reuses it; covered at the HTTP seam with Prisma mocked, asserting the transaction's call shape; the route appears in the OpenAPI document
- [ ] The matrix-to-Structure conversion is a pure function with a unit test covering a filled cell, a null cell and a merged-cell null
- [ ] Block headers have an editable name and an include tick; duplicate or blank names show an error at the header and disable Commit
- [ ] Commit sends only ticked Blocks with a busy state, lands on the Structure tab with the first Block selected and a summary of the counts, and shows a 409 inline
- [ ] The upload action is disabled with a hint while the Project has Blocks
- [ ] The e2e fake implements the commit route with the 409 and the e2e spec covers rename, untick, a duplicate name blocking Commit, a successful commit with the summary, the 409 and the disabled action
- [ ] All copy exists in both locales

## Comments
