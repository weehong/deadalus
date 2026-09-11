# Subcontractor Directory verification

Verification date: 2026-09-10. Scope: approved tickets 01–09 and all 62 stories
in [spec 0002](0002-subcontractor-directory.md). The implementation was reviewed
against the spec, root/backend agent instructions, frontend conventions,
CONTEXT.md and ADRs 0001–0004. No unresolved feature finding remains from the
implementation reviews. The preexisting local database configuration mismatch
is recorded as [ticket 10](../../.scratch/subcontractors/issues/10-align-local-database-schema.md).

## Combined checks

The coordinator ran these checks against integrated tickets 01–08; ticket 09
changes documentation only. Root `pnpm test` runs Vitest, while browser suites
are a separate command.

| Gate | Evidence |
| --- | --- |
| Root `pnpm lint` | Passed after final integration, both apps, zero warnings allowed. |
| Root `pnpm typecheck` | Passed after final integration, both apps. |
| Root `pnpm test` | Passed: 133 backend and 98 frontend tests, 231 total. |
| Full frontend browser suite | Passed: 159/159 across Chromium, Firefox and WebKit (2.3 minutes). |
| Backend e2e suite | Passed: 2/2 (3.3 seconds), with the isolated backend and database. |
| Supplementary keyboard and mobile flow | Passed: 3/3 across all three engines at 375px (15.5 seconds), with no horizontal overflow. |
| Production build | Root `pnpm build` passed for both apps. |
| Storybook build | Passed. |
| Authored source formatting | Prettier checks passed for 21 backend and 49 frontend files; generated route tree excluded as instructed by its header. |

The handoff's Playwright host limitation was stale: Chromium, Firefox and
WebKit launch on this host without installing packages. Earlier integrated
runs passed 54 cases for Directory/search/detail and 36 cases for
create/remove/delete across the three engines. Final full-suite results above
supersede those partial runs. Existing servers on ports 3000
and 5173 were left untouched; verification used isolated ports and test data.

## Story matrix

Each row identifies implementation evidence and observed behavior at an
approved seam. Source inspection is called out where it complements tests;
a browser fake does not prove a database constraint, and automated role/focus
checks do not claim a screen-reader product certification.

| Story | Capability | Evidence |
| --- | --- | --- |
| 1 | Sidebar opens the real Directory | [Directory] and [Directory browser]: rendered table and active navigation. |
| 2 | Alphabetical Directory | [Service] orders by name key and id; [List HTTP] asserts ordered pagination; [Rename browser] checks refreshed order. |
| 3 | Name, Member count and all phones per row | [Directory table], [List HTTP] and [Directory browser] assert all row fields. |
| 4 | Search Subcontractor name | [Search HTTP] tests trimmed, case-insensitive substrings; [Search browser] filters names. |
| 5 | Search Member name and phone | [Search HTTP] and [Search browser] return the owning Subcontractor. |
| 6 | Phone search ignores formatting and missing country code | [Search HTTP] and [Search browser] include local and formatted phone queries. |
| 7 | Debounced server search | [Directory] uses the existing 300 ms debounce; [Search browser] observes the delayed request. |
| 8 | Paging and totals | [Directory table], [List HTTP] and [Directory browser] cover defaults, cap, pages and totals. |
| 9 | Search resets to page 1 | [Search browser] covers page reset, including paging during the debounce pause. |
| 10 | Empty Directory invitation | [Directory browser] asserts the empty invitation; [Directory] provides New subcontractor. |
| 11 | Distinct no-match state | [Search browser] covers unmatched and cleared queries in both locales. |
| 12 | Directory loading state | [Directory browser] delays the response and observes loading status. |
| 13 | Directory error and retry | [Directory browser] returns a failed response, then verifies Retry succeeds. |
| 14 | New action in header | [Directory] actions slot and [Create browser] navigation from the Directory. |
| 15 | Three creation fields | [Create form], [Create component] and [Create browser] cover Subcontractor name and first Member name/phone. |
| 16 | Required fields with local errors | [Create component] and [Create browser] assert required fields and associated errors; [Create HTTP] refuses blank input. |
| 17 | Flexible spoken phone input | [Create browser] sends trimmed typed input; [Phone unit] and [Create HTTP] verify normalization. |
| 18 | Reject implausible phone before submit | [Client validation], [Create component] and [Create browser] refuse bad input before a request. |
| 19 | Explain duplicate Subcontractor name | [Create HTTP] returns the stable conflict; [Create browser] maps it to the name field. |
| 20 | Name the Subcontractor holding a taken phone | [Create HTTP] asserts conflict details; [Create browser] displays the owner at the phone field. |
| 21 | Case and whitespace name identity | [Name key], [Create HTTP] and [Rename HTTP] cover case, surrounding/repeated spaces and tabs; real migration parity checks below. |
| 22 | Creation lands on its screen | [Create browser] follows creation to detail and checks the stored phone. |
| 23 | Cancel creation returns to Directory | [Create browser] cancels the form; [Create component] observes the callback. |
| 24 | Busy creation refuses duplicates | [Create browser] delays the response; [Create component] asserts pending submission behavior. |
| 25 | Creation failure preserves input for retry | [Create browser] and [Create component] exercise inline failure and retained values. |
| 26 | Subcontractor heading and kicker | [Detail] and [Detail browser] show the name and Subcontractor kicker. |
| 27 | Back to Directory | [Detail browser] follows the back link from existing and missing records. |
| 28 | Inline rename | [Rename form] and [Rename browser] replace the heading and save the new name. |
| 29 | Rename uniqueness | [Rename HTTP] tests normalized collisions and own-name reuse; [Rename browser] displays the field error. |
| 30 | Member name and phone table | [Members table], [Detail HTTP] and [Detail browser] verify Members sorted by name then phone. |
| 31 | Add Member inline | [Member form], [Member HTTP] and [Member browser] exercise the table-footer form and full response. |
| 32 | Edit Member name or phone | [Member HTTP] verifies partial edits and preserved omitted values; [Member browser] edits the inline row. |
| 33 | Globally unique Member phones | [Prisma] unique phone constraint; [Member HTTP] covers same/other Subcontractor collisions and own phone; [Member browser] shows the owner. |
| 34 | Remove Member | [Remove HTTP] returns 204; [Remove browser] observes the row disappearing. |
| 35 | Refuse removal of last Member | [Remove HTTP] verifies LAST_MEMBER and concurrent removal; [Remove browser] preserves the final Member and explains why. |
| 36 | Delete from Subcontractor screen | [Detail], [Delete HTTP] and [Delete browser] provide the action and guarded deletion. |
| 37 | Confirmation names Subcontractor and count | [Delete dialog] and [Delete browser] cover singular/plural and Chinese confirmation. |
| 38 | Deletion removes Members | [Prisma] cascade reference; [Delete HTTP] asserts 204; actual database cascade separately verified below. |
| 39 | Deletion returns to Directory with row absent | [Delete browser] returns to the previously loaded Directory and verifies absence after reload. |
| 40 | Stale link has not-found state and back link | [Detail HTTP] asserts 404; [Detail browser] opens a missing id and returns to Directory. |
| 41 | Successful changes refresh both views | [Query family] and mutation hooks invalidate related queries; [Create browser], [Rename browser], [Member browser], [Remove browser], [Delete browser] check refreshed results. |
| 42 | Active sidebar across all feature routes | [Directory browser], [Detail browser] and [Create browser] assert active Subcontractors navigation. |
| 43 | Consistent stored phones | [Phone] stores E.164; [Directory table] and [Members table] render it unchanged; [Create browser] and [Member browser] observe normalized responses. |
| 44 | Chinese feature copy and errors | [Chinese] provides all feature keys; translated cases appear in each feature browser file. Locale audit below. |
| 45 | Narrow Directory and forms | [Directory browser], [Detail browser] and [Member browser] assert narrow viewport fit. The supplementary 375px flow also verifies creation and rename without horizontal overflow. |
| 46 | Keyboard-operable actions | [Directory table], [Create form], [Rename form], [Members table] and [Member form] use native anchors/buttons/inputs/forms. [Dialog component] and [Delete browser] exercise focus and Escape; the supplementary flow operates all feature actions with Tab, Shift+Tab and Enter. |
| 47 | Dialog focus enters and returns | [Dialog component] and [Delete browser] verify initial Cancel focus, both Tab directions, Cancel/Escape and trigger restoration. |
| 48 | Semantic Directory table and headers | [Directory table] renders table/thead/th with column scope; DirectoryTable.test.tsx and [Directory browser] assert roles. |
| 49 | Validation errors associated with fields | [Field] provides aria-invalid and aria-describedby; creation, rename and Member component tests assert error descriptions and focus. |
| 50 | Named accessible dialog | [Dialog], [Dialog component] and [Delete browser] assert dialog role and accessible name. |
| 51 | All feature URLs require Session | [Guard], [Auth browser], [Create browser] and [Detail browser] cover direct unauthenticated navigation. |
| 52 | Every API operation verifies token | [Router] installs requireAuth before all handlers; each HTTP file checks both missing and invalid tokens. |
| 53 | Nested Member addressing and wrong-parent refusal | [Router] exposes only nested Member operations; [Member HTTP] and [Remove HTTP] verify wrong-parent 404. |
| 54 | Server owns phone normalization | [Schemas] transforms through [Phone]; [Phone unit], [Create HTTP] and [Member HTTP] verify normalized writes and invalid rejection. |
| 55 | Atomic Subcontractor and first Member creation | [Service] uses one nested Prisma create; [Create HTTP] observes no partial record after a conflict; real constraint/migration evidence below. |
| 56 | Stable 409 codes | [Create HTTP], [Rename HTTP], [Member HTTP] and [Remove HTTP] assert conflict codes and phone-owner details. |
| 57 | All routes in OpenAPI | [OpenAPI] and every feature HTTP suite assert operation/security/response contracts. |
| 58 | HTTP seam with mocked Prisma and signed token | Feature HTTP tests use createApp, Supertest, the singleton Prisma mock and signed JWT/JWKS helpers; all run without a live database. |
| 59 | Browser seam with provider and API interception | [Provider fake] and [Fake] keep Session/router/query/screens real; feature browser suites drive the guarded Console. |
| 60 | Stories and tests beside presentation | All seven modules listed in the presentation audit below have colocated stories and tests. |
| 61 | Subcontractors placeholder removed | [Directory] renders real states; [Auth browser] and [Directory browser] assert the table. Projects retains the placeholder. |
| 62 | Documentation describes built Directory | [SPEC.md](../../SPEC.md#15-the-subcontractor-directory-and-its-members), [README](../../README.md#sign-in-and-the-console), frontend README and spec 0002 updated by ticket 09. |


## Database verification and deployment prerequisites

The coordinator used an isolated local PostgreSQL database with
`schema=daedalus2`. Initial, Subcontractor/Member and name-key migrations were
applied. Seed reruns restored eight example matches and three Subcontractors
with Members. Schema comparison reported no difference; application tables
were absent from `public`.

Implementation originally added the name key in a second migration that
backfilled the column with an ICU-collated `lower`, which introduced a
UTF8/ICU deployment prerequisite. Review on 2026-09-10 folded the column and
its unique index into the migration that creates the tables, since both
migrations were new and the table was empty at that point; the service derives
the key on every write, so no database lowercasing exists. Duplicate
identical-name Prisma creates failed with `P2002(nameKey)` for Unicode
fixtures (`İnşaat`, `ΟΣ`, a name with tabs/NBSP/repeated spaces, a Chinese
name) under the earlier history; the HTTP seam verifies translation to
`SUBCONTRACTOR_NAME_TAKEN`. Removing fixture parents confirmed their Members
were deleted by the foreign-key cascade. The merged migration produces the
same schema; the hosted database was not contacted.

Local fallback URLs in env.ts, the example's Docker comment and Compose still
select `public`. Supply `DATABASE_URL` explicitly with `schema=daedalus2` before
migration or seed commands. Ticket 10 records the configuration correction;
this implementation did not move or delete existing databases.

## Presentation and locale audit

Seven new presentational modules have a `.stories.tsx` and `.test.tsx` beside
the implementation: DirectoryTable, MembersTable, CreateSubcontractorForm,
RenameSubcontractorForm, MemberRowForm, DeleteSubcontractorDialog, and the
shared UI Dialog. Query-wired screens and hooks are exercised at the browser
seam rather than treated as plain-prop presentation.

English and Chinese feature keys were checked for matching purposes, labels,
interpolation and validation coverage. All 60 normalized feature keys match,
allowing English singular/plural variants. Chinese consistently uses 分包商 for
Subcontractor, 成员 for Member and 名录 for Directory. Create, rename and Member
forms reuse the same required-field and phone-conflict messages. Removal and
deletion have distinct verbs. Chinese has one count form; English has singular
and plural deletion messages. The locale file retains its machine-translation
flag and request for native review. No untranslated feature key or concrete
copy defect was found; no locale source was changed during this audit.

The coordinator's supplementary flow passed in Chromium, Firefox and WebKit
at 375px. Tab, Shift+Tab and Enter operated paging, search, creation and Cancel,
rename and Cancel, Member add/edit and Cancel, removal and LAST_MEMBER refusal,
and delete Cancel/Escape/confirmation with focus return. Directory, detail and
forms showed no horizontal overflow. This complements the repository’s narrow
Directory/detail/Member-form tests and dialog focus tests. The supplementary
script and log are session-local evidence; the source and repository tests
remain linked above. Initial harness selector corrections and Firefox's
forward Tab wrap into the development toolbar required no application change;
normal backward keyboard navigation reached the controls.

## Skill availability

The handoff's required skill names were audited in Claude Code's installed
skill paths and the live Codex catalog, independently of OpenCode. The shared
`tdd`, `codebase-design`, `domain-modeling`, `code-review` and
`resolving-merge-conflicts` files are installed through working symlinks under
`/home/vernon/.claude/skills/<name>/SKILL.md` and discoverable in Codex under
bare and curated names. Claude configuration and CLI resolution establish
discovery eligibility; no nested Claude model invocation or picker test was
performed. Claude `triage` and `implement-spec` are explicit-invocation only;
Codex exposes their `matt-skills-curated:` aliases. `run` is missing in both;
ordinary repository launch commands supplied that capability. No skills were
installed or modified.

## Evidence provenance

This durable summary records the coordinator's combined results and source
inspection. Session-local supporting artifacts are under
`/tmp/daedalus-subcontractors-run/`: `coordinator-notes.md`,
`ticket06-root-{lint,typecheck,test}.log`, ticket 01–08 implementation and
integration reports, `standards-review-initial.md`, `standards-review-final.md`, `spec-review-final.md`,
`unicode-backfill-remediation.md`, `skills-audit.md`, and
`final-{frontend-browser,backend-browser,build,storybook,keyboard-mobile}.log`.
These temporary files
may be removed; source and test links in this document remain the reproducible
verification entry points. No commit or push was made during implementation.

[Directory]: ../../apps/frontend/src/features/subcontractors/DirectoryPage.tsx
[Directory table]: ../../apps/frontend/src/features/subcontractors/DirectoryTable.tsx
[Directory browser]: ../../apps/frontend/e2e/subcontractors.spec.ts
[Search browser]: ../../apps/frontend/e2e/subcontractors-search.spec.ts
[List HTTP]: ../../apps/backend/tests/integration/subcontractors.route.test.ts
[Search HTTP]: ../../apps/backend/tests/integration/subcontractors-search.route.test.ts
[Detail]: ../../apps/frontend/src/features/subcontractors/SubcontractorPage.tsx
[Detail browser]: ../../apps/frontend/e2e/subcontractor-detail.spec.ts
[Detail HTTP]: ../../apps/backend/tests/integration/subcontractor-detail.route.test.ts
[Create form]: ../../apps/frontend/src/features/subcontractors/CreateSubcontractorForm.tsx
[Create component]: ../../apps/frontend/src/features/subcontractors/CreateSubcontractorForm.test.tsx
[Create browser]: ../../apps/frontend/e2e/subcontractor-create.spec.ts
[Create HTTP]: ../../apps/backend/tests/integration/subcontractor-create.route.test.ts
[Rename form]: ../../apps/frontend/src/features/subcontractors/RenameSubcontractorForm.tsx
[Rename browser]: ../../apps/frontend/e2e/subcontractor-rename.spec.ts
[Rename HTTP]: ../../apps/backend/tests/integration/subcontractor-rename.route.test.ts
[Members table]: ../../apps/frontend/src/features/subcontractors/MembersTable.tsx
[Member form]: ../../apps/frontend/src/features/subcontractors/MemberRowForm.tsx
[Member browser]: ../../apps/frontend/e2e/subcontractor-members.spec.ts
[Member HTTP]: ../../apps/backend/tests/integration/subcontractor-members.route.test.ts
[Remove browser]: ../../apps/frontend/e2e/remove-member.spec.ts
[Remove HTTP]: ../../apps/backend/tests/integration/remove-member.route.test.ts
[Delete dialog]: ../../apps/frontend/src/features/subcontractors/DeleteSubcontractorDialog.tsx
[Dialog]: ../../apps/frontend/src/components/ui/Dialog/Dialog.tsx
[Dialog component]: ../../apps/frontend/src/components/ui/Dialog/Dialog.test.tsx
[Delete browser]: ../../apps/frontend/e2e/subcontractor-delete.spec.ts
[Delete HTTP]: ../../apps/backend/tests/integration/subcontractor-delete.route.test.ts
[Phone]: ../../apps/backend/src/lib/normalize-phone.ts
[Phone unit]: ../../apps/backend/tests/unit/normalize-phone.test.ts
[Client validation]: ../../apps/frontend/src/features/subcontractors/formSchemas.ts
[Service]: ../../apps/backend/src/services/subcontractors.service.ts
[Router]: ../../apps/backend/src/routes/subcontractors.route.ts
[Schemas]: ../../apps/backend/src/schemas/subcontractors.schema.ts
[OpenAPI]: ../../apps/backend/src/openapi/registry.ts
[Prisma]: ../../apps/backend/prisma/schema.prisma
[Migration]: ../../apps/backend/prisma/migrations/20260909000100_subcontractors/migration.sql
[Query family]: ../../apps/frontend/src/features/subcontractors/useSubcontractorsQuery.ts
[Fake]: ../../apps/frontend/e2e/subcontractors-api.ts
[Provider fake]: ../../apps/frontend/e2e/provider.ts
[Guard]: ../../apps/frontend/src/routes/_console.ts
[Auth browser]: ../../apps/frontend/e2e/auth.spec.ts
[Field]: ../../apps/frontend/src/components/ui/Field/Field.tsx
[English]: ../../apps/frontend/src/assets/locales/en-US/translations.json
[Chinese]: ../../apps/frontend/src/assets/locales/zh-CN/translations.json
[Name key]: ../../apps/backend/src/lib/subcontractor-name.ts
