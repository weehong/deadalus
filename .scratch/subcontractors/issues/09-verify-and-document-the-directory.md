# 09: Verify the Directory end to end and document it

**What to build:** Nothing new for the Administrator. This ticket proves the Directory is complete: every user story in the spec is walked against the built screens, the full lint, typecheck and test suites are green across both apps, the zh-CN copy added by tickets 01 to 08 is reviewed for consistency, and SPEC.md gains a section describing the Directory as built while README's Console paragraph stops calling Subcontractors a placeholder.

Spec: `.scratch/subcontractors/spec.md`.

**Blocked by:** 02 (Search the Directory), 05 (Rename a Subcontractor), 06 (Add and edit Members), 07 (Remove a Member, never the last one), 08 (Delete a Subcontractor with confirmation)

**Status:** ready-for-agent

- [x] `pnpm lint`, `pnpm typecheck` and `pnpm test` pass at the root
- [x] Backend e2e and frontend e2e specs pass in an environment where Playwright runs; any spec that cannot run on the development host is noted as such
- [x] Every user story in the spec is checked against the built screens; any gap becomes a new ticket rather than being silently dropped
- [x] zh-CN strings for the feature are consistent with each other and flagged where machine-translated
- [x] SPEC.md has a section for the Subcontractor Directory recording what was built and any decisions that changed during the build
- [x] README no longer describes Subcontractors as a placeholder
- [x] The finished spec is copied to `docs/specs/` as the durable record, following the numbering there

## Comments

2026-09-10: Documentation and the 62-story evidence matrix are complete.
Integrated root lint, typecheck and 231 tests passed. Full frontend browser
suite passed 159 cases across three engines; production and Storybook builds
passed. Backend e2e passed 2 cases. The supplementary keyboard and mobile
flow passed in all three engines at 375px (3 cases, 15.5 seconds), covering all
feature actions and creation/rename forms without horizontal overflow.
All acceptance criteria are complete. The `ready-for-agent` triage label is
retained; implementation completion is recorded separately here.

The [verification record](../../../docs/specs/0002-subcontractor-directory-verification.md)
contains source/test links, combined outcomes, real database evidence, locale
and presentation audits, and skill discovery evidence. The preexisting local
schema mismatch is tracked in [ticket 10](10-align-local-database-schema.md).

2026-09-10: Review. Root lint had failed because the Storybook build output was linted; fixed with an ESLint ignore. The list service returned the `{ data, meta }` envelope; the controller owns it now. Docs updated for the merged migration. Standards smells (duplicated test setup, form submit helpers, OpenAPI 409 schema) and unrequested additions (serializable remove-Member retry, page-overflow 400) were noted and left as is.
