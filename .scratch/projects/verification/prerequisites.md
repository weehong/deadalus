# Implementation prerequisite evidence

Checked 2026-09-11 against baseline `aa20a0f`.

- Baseline Directory and canonical design files are already committed. The only starting untracked files were `codex-handoff/HANDOFF.md`, `dependency-graph.md`, and `workbook-layout-findings.md`; preserve them. The 23 glossary/spec/ticket/ADR snapshots match canonical files byte-for-byte.
- Node 26.7.0 and pnpm 11.24.0; `pnpm install --frozen-lockfile` passes.
- Configured database URL explicitly selects `daedalus2`; Prisma `SELECT 1` succeeds. No credentials printed or copied.
- Installed Playwright Chromium, Firefox and WebKit each launch and close successfully on this host. The handoff's missing browser dependencies assumption is stale.
- Baseline root lint, typecheck and unit/integration tests pass.
- Codex actual session catalogue exposes `domain-modeling`, `tdd`, `code-review`, `diagnosing-bugs`. Their files are readable in `~/.agents/skills`. `simplify` and `run` are absent from the Codex session catalogue.
- Claude Code actual runtime initialization (`--output-format stream-json`, `system/init` skills and slash commands) discovers all six suggested skills. This is stronger evidence than its filesystem symlinks, which expose only four of those six from the shared skill directory.
- Equivalent Codex workflows: review reuse/complexity directly and run the app with browser checks. Review both standards and acceptance criteria on uncommitted changes; the code-review skill's committed diff mechanism is adapted because the user forbids staging/committing.
- SheetJS pinned 0.20.3 CDN tarball returns HTTP 200. Registry reports Multer 2.3.0; official August 2026 Express security release identifies fixes in 2.3.0: https://expressjs.com/en/blog/2026-08-31-security-releases/ . Install/audit of these dependencies belongs to ticket 10.
- The user excluded the restored workbook from the sibling repository. Ticket 13 uses the source .xls and .xlsx files listed below; no client workbook is copied into this repository.

## Execution adjustments

Each ticket uses an isolated detached git worktree. Reviewed filesystem changes are transferred to the main workspace without staging, commits or pushes. Dependency readiness means changes integrated and relevant checks passed, rather than a git merge commit. Later worktrees receive a snapshot of integrated uncommitted changes; overlapping edits are merged against that snapshot.

Baseline combined checks: backend 15 test files / 133 tests; frontend 31 test files / 98 tests. Full frontend Playwright suite: 159 passed across Chromium, Firefox and WebKit. Browser launch availability has therefore also been verified by actual test execution.

Backend baseline Playwright API suite: 2 passed. Baseline dependency audit exits 1 with 15 pre-existing advisories (8 moderate, 5 high, 2 critical); tracked separately in `.scratch/dependency-audit/follow-up.md`. A zero-advisory full audit cannot be claimed without out-of-scope toolchain remediation.

## Database findings during ticket 01

The additive Projects migration was reviewed and deployed to the configured `daedalus2` schema. A rollback-only database probe passed table presence, sibling uniqueness and referenced Unit Type Restrict checks. It exposed PostgreSQL cascade ordering: directly deleting a Project with typed Units raises `P2003` (`units_unitTypeId_fkey`). Deleting its Blocks first, then its Project, inside the same transaction passes and removes Storeys, Units and Unit Types. Ticket 04 must use that ordering; do not weaken the required Restrict relation. This is a service implementation adjustment, not a domain-model change.

Ticket 01's deterministic seed ran twice successfully. Actual database counts remained one seeded Project, 2 Blocks, 4 Storeys, 8 Units and 2 Unit Types.

Original workbook candidates located on the mounted Windows drive (no repository copies): `/mnt/d/Downloads/Daedalus/Tampines Resi - Unit Matrix 20241127.xls` and `/mnt/d/Downloads/Daedalus/JT - Unit Distribution (UTC).xlsx`. Names and formats match the handoff; ticket 13 will verify counts directly from these files.

## Integration checks after tickets 02 and 03

Root lint, typecheck and unit/integration checks pass (backend 176 tests, frontend 115 tests); frontend build passes. Combined Projects list/create/detail browser suite passes 48 cases across all three browsers. A real-database HTTP probe through `createApp` with a locally signed verification token passes 5 checks: create with normalized code, read full Project, name uniqueness 409, code uniqueness 409, and code search. Its temporary Project was deleted in cleanup; existing data was not changed.

## Upload dependency installation

Installed Multer 2.3.0, SheetJS 0.20.3 from its pinned CDN URL, and @types/multer 2.0.0. The lockfile's supply-chain verification passed. `pnpm audit --json` still reports exactly the baseline 15 advisories (8 moderate, 5 high, 2 critical); no new package/advisory pair was introduced. Full audit remains nonzero because of the separately recorded baseline issues.

## Integration checks after ticket 08

Combined root lint, typecheck and unit/integration tests pass; the Unit Types/detail browser suite passes all 21 cases across Chromium, Firefox and WebKit.

## Integration checks after ticket 06

Combined root lint, typecheck and tests pass; Storeys browser scenarios pass all 6 cases across Chromium, Firefox and WebKit. Real database HTTP probe passes 21 checks, now also covering Storey concurrent batches, atomic clash, cross-Block name reuse and deletion cascade, plus Unit Type normalized conflict, description clearing, in-use refusal count and unused deletion. Temporary verification Projects are cleaned up.

Concurrent workspace change observed during implementation: root CONTEXT.md gained unrelated Item/Progression/Progress entry design updates. These are preserved; they are not part of the Projects implementation or its verification claims. Documentation tickets must retain them.

## Integration checks after ticket 13

Combined root lint/typecheck/tests pass; all 12 upload browser cases pass across Chromium, Firefox and WebKit. Original files also pass through the authenticated multipart HTTP route: both Tampines sheets: 12 Blocks / 1193 Units / 25 warnings, JT Unit Matrix: 4 Blocks / 638 Units / 1 warning. No Blocks or Unit Types were persisted by parse.

## Integration checks after ticket 11

Combined root lint/typecheck/tests and all 21 upload/commit browser cases pass. Real database Structure commit passes five checks: existing Type reuse, populated Project refusal, simultaneous commits (201/409), concurrent Type creation, and 10,000 Units with long Unicode names (3,182,445-byte request; 3340 ms). Temporary data cleaned up.

## Integration checks after ticket 07

Combined root lint/typecheck/tests pass; all 18 Units/Blocks/Storeys browser cases pass. Ten real database scenarios pass, including 2,000 Units in one batch and competing Unit Type deletion. A single initial 500 was not captured in detail; 230 diagnostic concurrent pairs passed. Inspection identified and fixed narrowly recognized Prisma COMMIT serialization errors bypassing the retry helper; added 12 regressions. Original cause is unconfirmed, and all live scenarios pass after the fix.

## Integration checks after ticket 12

Combined root lint/typecheck/tests pass; all 30 editor/upload/commit browser cases pass across Chromium, Firefox and WebKit with normal workspace fonts.

Final repository inspection confirms no staged changes, unchanged handoff artifacts and no workbook or temporary browser-runner files. Additional concurrent Item Catalogue/Catalogue Item/Assignment glossary edits were preserved by the three-way documentation integration; they remain outside this implementation.

## Final integrated checks — 2026-09-12

All 14 tickets are reviewed, integrated and complete. Root build, lint, typecheck
and tests pass (backend 378 across 31 files; frontend 155 across 48 files).
Backend Playwright passes 2 cases; the final full frontend suite passes 288 cases
across Chromium, Firefox and WebKit. [Ticket 09](ticket-09.md#final-combined-verification--2026-09-12)
records the test-only repairs after the first combined browser run and the final
clean run. Source code checks were reused after those test-only repairs; e2e
files pass Prettier but are outside the repository's ESLint configuration.

`git diff --check` passes. Handoff snapshots are unchanged; no original workbook
or temporary runner file was added, and nothing was staged, committed or pushed.
Unrelated glossary edits remain preserved. The 15 baseline dependency advisories,
native Chinese review, and Codex's unavailable `simplify`/`run` skills remain
accurately documented limitations, with equivalent workflows used for the latter.
