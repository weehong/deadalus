# 14: Verify and document the Unit Matrix upload

**What to build:** A pass over the upload against the spec: stories 50 to 62 checked against the running Console and the API, lint, typecheck and unit tests green at the root, the backend integration suite green, the e2e suite green where Playwright runs, and `/openapi.json` listing the parse and commit routes. SPEC.md and the README describe the upload as built; CONTEXT.md, ADR-0006 and ADR-0007 match what shipped. Any story that cannot be met is recorded here with the reason rather than silently dropped.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 12 (Correct the matrix before committing it), 13 (Read the awkward layouts and show their warnings)

**Status:** complete

- [x] A story matrix records, for each of stories 50 to 62, where it is verified (HTTP test, parser test, e2e spec, component test, or manual) or why it is not
- [x] Root lint, typecheck and unit tests pass; the backend integration suite passes; the e2e suite passes where Playwright runs
- [x] `/openapi.json` lists the parse and commit routes with schemas
- [x] SPEC.md and README describe the upload as built; CONTEXT.md, ADR-0006 and ADR-0007 are consistent with the code
- [x] zh-CN carries a flagged translation for every new en-US key

## Comments


### Documentation and verification — 2026-09-11

[The story matrix](../verification/ticket-14.md) accounts for every story 50–62,
separating mocked HTTP and browser coverage from actual original-workbook and
PostgreSQL evidence. It reuses the recorded integrated checks for unchanged code.
The originals are the source `.xls` and `.xlsx` in `/mnt/d/Downloads/Daedalus/`;
the restored sibling workbook is explicitly excluded.

A reusable read-only `check-upload-contract.mjs` requests the actual Express
`/openapi.json` and validates both guarded operations, request and response
schemas, the binary upload field, nested commit limits and stable warning codes.
It passed, as did parity, nonempty values and interpolation checks for all 59
upload translation keys; zh-CN retains its machine-translation review flag.

README now describes the built upload workflow and API, and SPEC section 17
records shipped behavior, limits and the explicit ticket 13 missing-Stack
inference clarification. CONTEXT and ADR-0006/0007 already match, so no domain
edits were needed. Approved handoff snapshots and unrelated Item/Progression
changes are preserved.

The final combined root/static/test/build and backend/frontend browser checks
remain the integration owner's gate after these documentation changes are
integrated. This issue remains in-review until those results are recorded.

### Integrated completion — 2026-09-12

Reviewed and integrated. Root build, lint, typecheck and tests pass (378 backend,
155 frontend); backend Playwright passes 2 cases and the full frontend suite
passes 288 cases across all three engines. Final evidence is recorded in the
linked verification matrix. All acceptance criteria are complete. No staging,
commits or pushes.
