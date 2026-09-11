# 09: Verify and document Projects and their Structure

**What to build:** A pass over the finished feature against the spec: every user story checked against the running Console and the API, the whole e2e suite green in an environment where Playwright runs, lint, typecheck and unit tests green at the root, and the OpenAPI document listing every Project route. SPEC.md and the README describe Projects, the Structure panes, batch creation and Unit Types as built, the Console placeholder and its `notBuilt` translation key are gone from both locale files, and CONTEXT.md and ADR-0005 match what shipped. Any story that cannot be met is recorded here with the reason rather than silently dropped.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 02 (Create a Project), 04 (Edit and delete a Project), 07 (Add Units across Storeys in batches), 08 (Unit Types tab)

**Status:** ready-for-agent

- [ ] A story matrix records, for each of the 49 stories, where it is verified (HTTP test, e2e spec, component test, or manual) or why it is not
- [ ] Root lint, typecheck and unit tests pass; the backend integration suite passes; the e2e suite passes where Playwright runs
- [ ] `/openapi.json` lists every Project, Block, Storey, Unit and Unit Type route with schemas
- [ ] The `notBuilt` placeholder component usage and key are removed, and zh-CN carries a flagged translation for every new en-US key
- [ ] SPEC.md and README describe the feature as built; CONTEXT.md and ADR-0005 are consistent with the code

## Comments
