# Agent Rules

Production Express 5 + TypeScript API. Honor these conventions — they are enforced
by ESLint (`--max-warnings 0`), strict TypeScript, and Prettier.

## Architecture

- **App-factory / server split.** `src/app.ts` exports `createApp(): Application`
  and wires middleware + routes but never calls `listen`. `src/server.ts` owns the
  network lifecycle (listen + graceful shutdown). Keep them separate — integration
  tests depend on driving `createApp()` through `supertest` with no open port.
- **Express 5 native async errors.** Route handlers may be `async` and simply
  `throw` (use `HttpError` from `@/lib/http-error.js`). Do **not** add an
  `asyncHandler` wrapper or `express-async-errors`; Express 5 forwards rejected
  promises to the central error handler automatically.
- **Validate at the edge.** Parse untrusted input with zod via the `validate({...})`
  middleware (`@/middlewares/validate.js`). Downstream code trusts the parsed types.
- **Layered flow:** route → controller (thin, sends JSON) → service (pure logic).
- **Single Prisma client.** Import the singleton from `@/lib/prisma.js`; never
  construct `new PrismaClient()` elsewhere.
- **OpenAPI from zod.** Register schemas/paths in `@/openapi/registry.js`; the
  document is generated and served at `/docs` and `/openapi.json`. No hand-written
  spec.

## Conventions

- Imports use the `@/*` alias (mapped to `src/`). At build time `tsc-alias` rewrites
  these to relative paths; relative imports include the `.js` extension (ESM).
- Explicit return types on every exported function; `import type { ... }` for
  type-only imports; `Array<T>` (never `T[]`).
- Structured logging only — use `req.log` / the pino `logger`, never `console.log`.
- Configuration comes from the validated, frozen `env` object (`@/config/env.js`);
  invalid env fails fast at boot.
- Tabs for indentation; Conventional Commits by convention (commitlint was
  removed when this app moved into the daedalus-2 workspace).

## Commands

`pnpm dev` · `pnpm build` · `pnpm start` · `pnpm lint` ·
`pnpm typecheck` · `pnpm test:unit:run` · `pnpm test:e2e` ·
`pnpm db:migrate`
