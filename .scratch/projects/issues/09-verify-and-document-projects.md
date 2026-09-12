# 09: Verify and document Projects and their Structure

**What to build:** A pass over the finished feature against the spec: every user story checked against the running Console and the API, the whole e2e suite green in an environment where Playwright runs, lint, typecheck and unit tests green at the root, and the OpenAPI document listing every Project route. SPEC.md and the README describe Projects, the Structure panes, batch creation and Unit Types as built, the Console placeholder and its `notBuilt` translation key are gone from both locale files, and CONTEXT.md and ADR-0005 match what shipped. Any story that cannot be met is recorded here with the reason rather than silently dropped.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 02 (Create a Project), 04 (Edit and delete a Project), 07 (Add Units across Storeys in batches), 08 (Unit Types tab)

**Status:** complete

- [x] A story matrix records, for each of the 49 stories, where it is verified (HTTP test, e2e spec, component test, or manual) or why it is not
- [x] Root lint, typecheck and unit tests pass; the backend integration suite passes; the e2e suite passes where Playwright runs
- [x] `/openapi.json` lists every Project, Block, Storey, Unit and Unit Type route with schemas
- [x] The `notBuilt` placeholder component usage and key are removed, and zh-CN carries a flagged translation for every new en-US key
- [x] SPEC.md and README describe the feature as built; CONTEXT.md and ADR-0005 are consistent with the code

## Comments


2026-09-11: [49-story matrix and evidence](../verification/ticket-09.md) complete.
Reused prior integration and real database evidence. Added a generated-OpenAPI
and missing/invalid token sweep for all 17 manual-Structure operations; fixed
six request bodies incorrectly documented as optional. All 34 HTTP cases pass.
Removed unused Placeholder component and Page-test usage, plus both obsolete
locale keys. Page tests (2), targeted ESLint and new Chromium deep-route/keyboard
browser cases (4) pass. All 194 English Projects leaves have Chinese equivalents
(plural forms correctly collapse in Chinese), with the native-review flag.
README, frontend README and SPEC now describe Projects; CONTEXT clarifies manual
versus workbook-derived names/order without changing unrelated glossary work.
ADR-0005 already matches. No staging, commits or pushes. Coordinator owns final
combined root/build/backend/frontend Playwright gate and completion status.

### Integrated completion — 2026-09-12

Reviewed and integrated. Root build, lint, typecheck and tests pass (378 backend,
155 frontend); backend Playwright passes 2 cases and the full frontend suite
passes 288 cases across all three engines. Final evidence is recorded in the
linked verification matrix. All acceptance criteria are complete. No staging,
commits or pushes.
