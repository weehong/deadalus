# Scaffold Prompt

> **Note — this app now lives in the daedalus-2 workspace.**
> This document records the original standalone scaffold. It has since diverged:
> the app is managed by pnpm (not npm) from the workspace root, Husky/commitlint/
> commitizen were removed, zod was upgraded to 4 (with
> `@asteasolutions/zod-to-openapi` 9), the placeholder `User` model was replaced
> by `Match`, and a `matches` vertical slice plus `prisma/seed.ts` were added.
> Treat the file listings below as historical. See the workspace `README.md` and
> `SPEC.md` for current instructions.

Paste the prompt below into an AI coding agent running in an **empty directory** to
reproduce this Express 5 + TypeScript API boilerplate. Replace the parameters first.

## How To Use

1. Create and `cd` into an empty directory.
2. Substitute the parameters below.
3. Hand the agent everything under "Prompt".
4. Run the verification commands and confirm the acceptance criteria.

## Parameters

| Parameter | Default | Meaning |
| --- | --- | --- |
| `<PROJECT_NAME>` | `express-api-boilerplate` | npm package name |
| `<PORT>` | `3000` | Default HTTP port |
| `<AUTHOR>` | `Vernon Wee Hong KOH` | package.json author |

## Conventions You Must Honor

- **Express 5**, ESM (`"type": "module"`, `module: NodeNext`, `.js` import extensions).
- **App-factory / server split:** `createApp()` builds the app with no `listen`;
  `server.ts` listens and handles graceful shutdown (`SIGTERM`/`SIGINT`, Prisma
  disconnect).
- Async handlers `throw` (no `asyncHandler` wrapper) — Express 5 forwards errors to
  the central handler.
- Validate untrusted input with **zod** at the edge; configuration is a frozen,
  zod-validated `env` object that **fails fast** on invalid values.
- **Prisma** singleton client; **OpenAPI** generated from zod, served at `/docs`.
- Strict TypeScript + ESLint (`--max-warnings 0`): explicit return types,
  `import type`, `Array<T>` (never `T[]`), `@/*` alias imports.
- **Prettier with tabs**, `endOfLine: lf`. **Conventional Commits** via Husky +
  Commitlint + Commitizen.
- Structured logging via **pino** only (no `console.log`).

## File Manifest

```text
.dockerignore        .env.example          .gitignore
.husky/commit-msg    .husky/prepare-commit-msg
.vscode/extensions.json   .vscode/launch.json
AGENTS.md  CLAUDE.md (=> @AGENTS.md)  README.md  SCAFFOLD.md
Dockerfile  docker-compose.yml
commitlint.config.cjs  eslint.config.js  prettier.config.js
package.json  tsconfig.json  tsconfig.build.json
vitest.config.ts  vitest.setup.ts  playwright.config.ts
prisma/schema.prisma
src/
  env.d.ts  app.ts  server.ts
  config/env.ts  config/logger.ts
  lib/prisma.ts  lib/http-error.ts
  middlewares/error-handler.ts  middlewares/not-found.ts
  middlewares/validate.ts  middlewares/request-logger.ts
  routes/index.ts  routes/health.route.ts
  controllers/health.controller.ts
  services/health.service.ts
  openapi/registry.ts  openapi/document.ts
  types/api.ts  types/express.d.ts
tests/unit/health.service.test.ts
tests/integration/health.route.test.ts
e2e/health.spec.ts
```

## Required Package Scripts

`dev` (tsx watch) · `build` (`tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json`)
· `start` (`node dist/server.js`) · `typecheck` · `format` · `lint` / `lint:fix`
(`--max-warnings 0`) · `test` · `test:unit` / `test:unit:run` / `test:unit:coverage`
· `test:e2e` / `test:e2e:report` · `db:generate` / `db:migrate` / `db:deploy` /
`db:studio` · `db:seed` · `db:reset` · `setup`.

## Setup And Verification

```sh
pnpm install
pnpm setup
docker compose up -d db   # or `pnpm db:up` from the workspace root
pnpm db:generate && pnpm db:migrate
pnpm format
pnpm lint
pnpm typecheck
pnpm test:unit:run
pnpm build
pnpm start &   # then: curl -s localhost:<PORT>/health
pnpm test:e2e
```

## Acceptance Criteria

- `pnpm lint`, `pnpm typecheck`, `pnpm test:unit:run`, and `pnpm build`
  all pass.
- `GET /health` returns `200` with `{ "data": { "status": "ok", ... } }`.
- `/docs` serves Swagger UI; `/openapi.json` returns the generated document.
- An unknown route returns a `404` JSON error envelope.
- Invalid env (e.g. `PORT=abc`) makes `pnpm start` exit non-zero with a readable
  zod error.
- `SIGTERM` drains in-flight requests, disconnects Prisma, and exits `0`.
- `README.md` reflects the chosen parameters.

## Initial Commit Message

```text
feat: add production express api boilerplate

- Express 5 + TypeScript (ESM) with app-factory/server split
- Prisma/PostgreSQL, zod env + request validation, pino logging
- helmet, cors, compression, rate limiting, graceful shutdown
- OpenAPI via zod-to-openapi served on Swagger UI
- Vitest + supertest + Playwright, multi-stage Docker
```
