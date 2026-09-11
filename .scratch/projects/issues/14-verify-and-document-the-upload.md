# 14: Verify and document the Unit Matrix upload

**What to build:** A pass over the upload against the spec: stories 50 to 62 checked against the running Console and the API, lint, typecheck and unit tests green at the root, the backend integration suite green, the e2e suite green where Playwright runs, and `/openapi.json` listing the parse and commit routes. SPEC.md and the README describe the upload as built; CONTEXT.md, ADR-0006 and ADR-0007 match what shipped. Any story that cannot be met is recorded here with the reason rather than silently dropped.

Spec: `.scratch/projects/spec.md`.

**Blocked by:** 12 (Correct the matrix before committing it), 13 (Read the awkward layouts and show their warnings)

**Status:** ready-for-agent

- [ ] A story matrix records, for each of stories 50 to 62, where it is verified (HTTP test, parser test, e2e spec, component test, or manual) or why it is not
- [ ] Root lint, typecheck and unit tests pass; the backend integration suite passes; the e2e suite passes where Playwright runs
- [ ] `/openapi.json` lists the parse and commit routes with schemas
- [ ] SPEC.md and README describe the upload as built; CONTEXT.md, ADR-0006 and ADR-0007 are consistent with the code
- [ ] zh-CN carries a flagged translation for every new en-US key

## Comments
