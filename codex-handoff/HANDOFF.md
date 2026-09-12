# Handoff: implement Projects, their Structure, and the Unit Matrix upload

Written 2026-09-11 at the end of a design session. The next session runs
Codex agents in parallel to implement fourteen approved tickets. Start Codex
with this directory, `./codex-handoff/`, as its reference.

Everything in this directory except this file, `dependency-graph.md` and
`workbook-layout-findings.md` is a snapshot of a file that lives elsewhere
in the repository. Treat the repository copies as canonical and edit those,
never the snapshots.

## What was decided and where it lives

| Artifact | Canonical path | Snapshot here |
|---|---|---|
| Feature spec, 62 user stories, implementation and testing decisions | `.scratch/projects/spec.md` | `spec.md` |
| Fourteen tickets, one file each, all `ready-for-agent` | `.scratch/projects/issues/` | `issues/` |
| Glossary (use its exact vocabulary in code, tests, copy) | `CONTEXT.md` | `CONTEXT.md` |
| ADRs 0001 to 0007; 0005, 0006 and 0007 govern this feature | `docs/adr/` | `adr/` |
| How tickets are tracked and triaged, how the glossary is applied | `docs/agents/` | `agent-docs/` |
| Monorepo and backend agent rules | `AGENTS.md`, `apps/backend/AGENTS.md` | `agent-docs/ROOT-AGENTS.md`, `agent-docs/BACKEND-AGENTS.md` |
| Ticket dependency graph and parallel waves | this directory only | `dependency-graph.md` |
| Layout facts about the real developer workbooks | this directory only | `workbook-layout-findings.md` |

The interview (grilling) and the ticket approval (to-tickets) steps are
complete. Every design question the user was asked is answered and recorded
in the spec; nothing in the tickets is provisional.

## How the session got here

- A spec for Projects and their Structure already existed from an interview
  on 2026-09-10 and 09-11, with spreadsheet upload out of scope pending the
  real sheets. The user then supplied two developer workbooks and three
  plan PDFs.
- The session read all five documents, mapped the existing Subcontractor
  Directory feature as the pattern to copy, and ran a three-round interview.
  Outcomes: the existing spec stands and is extended; the server parses
  developer workbooks heuristically with a stateless parse-then-commit
  flow; upload is Project-level and refused unless the Project has no
  Blocks; every distinct cell string is a Unit Type; Unit Type description
  is optional and the code key strips all whitespace; empty floors are
  skipped; a merged cell is one Unit; the preview has an editable matrix.
- The glossary entries for Block, Storey, Unit Matrix and Unit Type were
  amended, ADR-0006 and ADR-0007 written, the spec amended, and tickets 10
  to 14 re-sliced into tracer bullets on the user's approval.

## Ground rules for the implementing agents

- Read `CONTEXT.md` and `docs/agents/domain.md` first. Titles, test names
  and UI copy use the glossary's terms and avoid its listed synonyms.
- Read `apps/backend/AGENTS.md` before backend work. There is no frontend
  AGENTS.md; the frontend conventions are in `apps/frontend/SCAFFOLD.md`
  ("Conventions you must honor") and `apps/frontend/README.md`. Key ones:
  explicit return types, `Array<T>`, sorted JSX props, tabs, zero ESLint
  warnings, typed i18n keys that must exist in both `en-US` and `zh-CN`
  locale files, never hand-edit the generated route tree.
- Copy the Subcontractor Directory feature's shape end to end: route ->
  controller -> service on the backend with zod schemas registered in the
  OpenAPI registry; a `features/<name>` module on the frontend with API
  functions, TanStack Query hooks, presentational components each with a
  story and a test beside it; integration tests through the app factory
  with Prisma mocked and a signed test token; Playwright specs against a
  browser-edge in-memory fake of the API.
- Ticket status lives in the `**Status:**` line of each ticket file.
  Conversation goes under `## Comments` at the bottom. Do not modify the
  spec from a ticket; raise a comment instead.
- Commit messages follow Conventional Commits. Do not commit or push
  without the user asking.

## Execution plan

See `dependency-graph.md` for the full graph. In short:

1. Ticket 01 runs alone first. It owns the Prisma migration for all five
   models, so nothing else can start until it merges.
2. Then 02 and 03. Then 04, 05, 08 and 10 in parallel. Then 06, 11 and 13.
   Then 07 and 12. Then 09 and 14.
3. Give each parallel ticket its own git worktree on a branch off the
   integration branch, and rebase before merging. The files most likely to
   conflict are listed at the end of `dependency-graph.md`.

## Unresolved items the next session must settle before spawning agents

1. **The working tree is not committed.** At handoff time `git status`
   shows 64 changes: the whole Subcontractor Directory feature (backend
   routes, services, tests, migration; frontend feature module, routes,
   e2e specs), `AGENTS.md`, `CLAUDE.md`, ADRs 0003 to 0007, the amended
   `CONTEXT.md`, `.scratch/`, and this directory. Parallel agents need a
   committed baseline. Ask the user whether to commit the Directory work
   and the design artifacts first, and whether `.scratch/` and
   `codex-handoff/` belong in git or in `.gitignore`.
2. **Playwright cannot run on the development host** (system dependencies
   missing, per the spec's notes). E2E specs are written to the contract
   and verified where Playwright runs. Decide where that is before tickets
   09 and 14.
3. **The real workbooks for the hand run in ticket 13** live outside the
   repository on the user's machine. Ask the user for the path; never copy
   them into the repository or the fixtures.
4. **Dependency versions to confirm at install time**: SheetJS 0.20.3 is
   the latest tarball on its CDN as of 2026-09-11 (verified by request);
   pick the current `multer` major that supports Express 5. Node 26 and
   pnpm 11 are installed; the repo requires Node 22 or newer.
5. **zh-CN copy** is machine-translated and flagged in a `_comment` key by
   convention. Nobody has reviewed the translations; leave the flag on.
6. **Ticket 01 is large** (five models, seed, shared name-key module, list
   route, list screen, e2e fake). The user kept it whole as deliberate
   prefactoring. If the agent running it runs out of context, split at the
   seam between "models, seed, helper" and "list route and screen", keeping
   01's number for the first half.

## Suggested skills to load

Load with the Skill tool at the start of each implementing session.

- `domain-modeling`: to read `CONTEXT.md` and the ADRs before naming
  anything, and to raise a glossary gap instead of inventing a term.
- `tdd`: every ticket lists its HTTP-seam, unit and e2e coverage; write the
  failing test first, in the style of the existing Subcontractor tests.
- `code-review`: before marking a ticket done, review the branch against
  the spec and the app's coding standards.
- `simplify`: after a ticket's tests pass, one pass for reuse and altitude
  before review.
- `diagnosing-bugs`: when an integration test or the parser misbehaves,
  rather than patching symptoms.
- `run`: to see a screen working in the real app once the dev server can
  reach a database.

## Facts an agent would otherwise have to rediscover

- The backend today parses JSON only; no multipart, no spreadsheet library
  anywhere in the monorepo. Ticket 10 introduces both.
- The Projects sidebar entry, the `/projects` route file and a placeholder
  page already exist; ticket 01 replaces the placeholder and renames the
  route file to the index form.
- The Subcontractor name-key helper (`trim`, collapse whitespace, lower
  case) moves to a shared module in ticket 01 and is reused for Project,
  Block, Storey and Unit names.
- The Unit Type code key is a different rule (upper-case, remove all
  whitespace) and gets its own helper in ticket 08.
- Stack numbers in every real schedule are project-wide (1 to 114), so a
  Unit's name is the stack number as printed, padded to two digits, never
  renumbered per Block.
- Integration tests never touch a database: Prisma is mocked at the
  singleton, including the transaction wrapper, and the auth middleware is
  satisfied by a token signed with a test key served from a stubbed JWKS.
