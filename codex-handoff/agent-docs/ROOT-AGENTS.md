# Agent Rules

Daedalus is a pnpm monorepo: an Express 5 API in `apps/backend` and a Vite +
React client in `apps/frontend`. Each app carries its own agent rules in its
`AGENTS.md`; read the one for the app you are working in.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles use their default names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
