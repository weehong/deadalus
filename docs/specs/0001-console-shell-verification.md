# Spec 0001 verification

Recorded 2026-09-09 against [Spec 0001](0001-console-shell-and-content-layout.md),
`SPEC.md` §14, `CONTEXT.md` and ADR-0001. Implementation and documentation are
integrated. Browser acceptance, combined checks and the independent standards
and spec reviews are complete and passed.

## Execution and ownership

The starting workspace contained an unfinished, uncommitted implementation.
Ticket worktrees were seeded from that draft, with distinct ownership; approved
changes were copied back with checks that the destination had not changed.
Unrelated changes were preserved. No commits, staging or pushes were performed.
The coordinator assigned work and reviewed results without duplicating delegated
implementation. At most five subagents ran concurrently.

| Ticket | Blockers | Scope and acceptance | Status |
| --- | --- | --- | --- |
| T1 | None | Page, PageHeader and Placeholder; content rhythm, header actions, stories, tests, barrels and single-main composition | Reviewed and integrated |
| T2 | None | Sidebar, NavItem and AccountBlock; brand, navigation semantics, active entry, email truncation, initials, stories and tests | Reviewed and integrated |
| T3 | None | ConsoleShell and Button; desktop sidebar, mobile drawer, toggle/Escape/backdrop/path dismissal, focus return and accessibility | Reviewed and integrated |
| T4 | None | Console feature, pages, guarded routes, typed navigation, Session identity, sign-out states, locales and example landmark | Reviewed, integrated and verified |
| T4b | T4 integrated; regression discovered during T5 | Preserve the Session on provider revocation failure; public SDK cleanup and invalid-Session handling; seven provider-edge regression cases | Reviewed, integrated and verified |
| T5 | T1–T4 and T4b integrated | Provider-intercepted Playwright coverage of navigation, guards, persistence, mobile menu, sign-out, copy and example; all configured browsers | 45 browser cases passed |
| T6 | T1–T4 integrated | Root/frontend README corrections, spec progress and acceptance evidence | Reviewed and integrated |
| Skills verification | None | Confirm seven skills in both Codex and Claude Code through actual runtime metadata | Passed |
| Final review | T5 and T6 | Independent standards and spec reviews, resulting fixes and relevant combined checks | Zero findings in each review; all 41 user stories covered |

T1–T4 and skills verification were eligible to run concurrently. T5 and T6
started only after T1–T4 were integrated. T5 exposed a provider failure regression
and its final acceptance waited for T4b to be reviewed and integrated. Existing deleted frontend identity
files remain deleted; the backend `/me` route and its tests remain intact.

## Authentication-boundary correction

The installed auth-js SDK cleared the local Session when provider revocation
failed, preventing the inline failure alert and retry required by this spec.
T4b stages public SDK operations: first revoke globally with
`supabase.auth.admin.signOut` using the Session's access token, then use
`supabase.auth.signOut({ scope: "local" })` for SDK-owned persistence removal
and the `SIGNED_OUT` notification. The first call uses the user's JWT;
it requires no service-role credential. The SDK has no public cleanup-only
operation, so successful Sign out can make a second, idempotent logout request.

Network and server failures during revocation preserve the Session and permit
retry. Missing Sessions and already-invalid Session responses (401, 403 and 404)
can still complete Sign out. A cleanup-request error after revocation is harmless
when the SDK has removed the local Session; a remaining Session still produces
an error. Seven regressions exercise the real SDK with fetch intercepted at the
provider edge: server and network failure with retry (two), successful revocation
(one), invalid Session statuses (three), and cleanup-request failure (one).

## Completed verification

Final combined checks ran against the integrated implementation, including T4b
and the browser suite. Every final command returned exit status 0:

| Command | Result |
| --- | --- |
| `pnpm lint` | Frontend and backend passed with zero ESLint warnings |
| `pnpm typecheck` | Frontend and backend passed |
| `pnpm test` | 96 tests passed: frontend 75 across 24 files; backend 21 across 6 files |
| `pnpm build` | Frontend and backend production builds passed |
| `pnpm --filter @daedalus/frontend storybook:build` | Storybook build passed before the authentication-boundary correction; no story changes required a repeat |
| Frontend Playwright suite | 45 passed in 38.1 seconds: 15 cases each in Chromium, Firefox and WebKit |
| Prettier check of changed frontend source | 47 TS, TSX and JSON files passed; generated route tree excluded |
| Strict standalone TypeScript check of `e2e/auth.spec.ts`, `e2e/example.spec.ts`, `e2e/provider.ts` | Passed; these files are outside the application tsconfig |

The browser-file check ran from `apps/frontend` with
`node_modules/.bin/tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --types node e2e/auth.spec.ts e2e/example.spec.ts e2e/provider.ts`.
Independent reviewers reported **zero standards findings** and **zero spec
findings**, covering all 41 user stories.

Ticket checks also covered targeted tests, TypeScript, lint and formatting.
The seeded ConsoleShell story received a formatting-only correction and then
passed its exact-file Prettier and ESLint checks. Tooling emitted nonblocking
Node localStorage and Storybook deprecation warnings, plus Vite large-chunk
warnings. These did not fail the checks.

The first final lint invocation scanned ignored generated Storybook bundles.
After confirming that `storybook-static` contained no tracked files and was
ignored, the output was archived outside the repository; root lint then passed.
No ESLint configuration or source change was needed. Frontend/backend build
outputs and Playwright reports/results are ignored and untracked. The Git index
remains empty; no commits, staging or pushes were performed.

## Temporary evidence

Session artifacts are retained under `/tmp/daedalus-console-_ro57o75/`; these
temporary files are not repository deliverables and may be removed by OS cleanup.
All seven temporary worktree source snapshots were archived as
`worktree-archives/<name>.tar.gz`, with manifests and file SHA-256 verification,
before those session-created worktrees were removed. The main workspace and
original environment/dependency paths were preserved.

- Final logs: `check-final-lint.log`, `check-final-typecheck.log`,
  `check-final-test.log`, `check-final-build.log`, `check-final-format.log`,
  `check-final-e2e-types.log` and `browser-final.log`.
- Earlier Storybook build log: `check-storybook.log`; preserved build:
  `storybook-static/`.
- Screenshots: `console-desktop.png`, `console-mobile-closed.png` and
  `console-mobile-open.png`.

## Skills available in both runtimes

Verified skills: `handoff`, `implement-spec`, `implement`, `tdd`, `code-review`,
`to-spec` and `to-tickets`.

- Codex CLI **0.153.4**: the app-server `skills/list` response returned all
  seven with `enabled: true`, `scope: user`, paths under `~/.agents/skills`,
  and an empty errors list.
- Claude Code **2.1.266**: initialize-only SDK discovery returned all seven
  as `(user)` commands, backed by valid `~/.claude/skills` symlinks.

This verified discovery in each application, beyond availability in the
orchestrating session. No model prompt, installation or configuration change
was needed. The raw `handoff`, `implement-spec`, `implement`, `to-spec` and
`to-tickets` skills set `disable-model-invocation: true`, so their availability
supports explicit invocation rather than automatic model selection.
The orchestrating session also exposes separate `matt-skills-curated:<name>`
copies from plugin cache version 1.1.0; those namespaced copies do not substitute
for the independently verified user-skill discovery in each CLI.
