# Daedalus API

A production-grade HTTP API starter built on **Express 5**, **TypeScript**, and
**Node.js**, sharing the tooling standards of the sibling boilerplates in this
monorepo (strict ESLint, Prettier with tabs, strict `tsconfig`, Husky + Commitlint
+ Commitizen, Vitest + Playwright, multi-stage Docker).

## Overview

- **Express 5** with native async error propagation (handlers just `throw`).
- **TypeScript** in strict mode with the `@/*` path alias.
- **Prisma** ORM targeting **PostgreSQL**.
- **zod** for fail-fast environment validation and request validation.
- **pino** + **pino-http** for structured, per-request logging.
- **helmet**, **cors**, **compression**, and **express-rate-limit** by default.
- **OpenAPI** generated from zod schemas and served via **Swagger UI** at `/docs`.
- **Vitest** (unit) + **supertest** (integration) + **Playwright** (e2e).
- Graceful shutdown on `SIGTERM`/`SIGINT` with Prisma disconnect.

## Requirements

- Node.js **22+**
- pnpm
- PostgreSQL 16+ (a local instance is provided via `docker compose`)
- Docker (optional, for containerized builds)

## Getting Started

```sh
pnpm install
pnpm setup           # playwright install
cp .env.example .env     # then adjust values as needed

docker compose up -d db  # start local PostgreSQL
pnpm db:migrate       # create the schema

pnpm dev              # http://localhost:3000
```

Verify it is up:

- `GET http://localhost:3000/health` → `{ "data": { "status": "ok", ... } }`
- `GET http://localhost:3000/ready` → readiness incl. database check
- `http://localhost:3000/docs` → Swagger UI
- `http://localhost:3000/openapi.json` → raw OpenAPI document

## Environment

Validated at boot by `src/config/env.ts`; invalid values exit the process with a
readable error. Defaults make local development work out of the box.

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `3000` | HTTP listen port |
| `LOG_LEVEL` | `info` | pino level (`fatal`…`trace`) |
| `CORS_ORIGIN` | `*` | `*` or comma-separated origin list |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |
| `DATABASE_URL` | local Postgres | Prisma PostgreSQL connection string |
| `SUPABASE_URL` | — (required) | Supabase project URL; Administrator tokens verify against its JWKS |
| `MEMBER_TOKEN_SECRET` | — (required) | Signs the Field's Member tokens (HS256); at least 32 characters |

## Important Notes

- **Path alias `@/*`** maps to `src/*`. `tsx` resolves it in development; at build
  time `tsc-alias` rewrites it to relative paths in `dist/`.
- **App-factory / server split:** `createApp()` (in `src/app.ts`) builds the app
  with no open port so integration tests can use `supertest`; `src/server.ts` owns
  listening and graceful shutdown.
- **Express 5 errors:** async handlers may `throw` (e.g. `HttpError`); the central
  error handler catches rejected promises — no wrapper needed.
- **Strict TypeScript & ESLint** are enforced; `pnpm lint` runs with
  `--max-warnings 0`. Explicit return types, `import type`, and `Array<T>` required.
- **Prettier formats with tabs** (`endOfLine: lf`). Run `pnpm format`.
- **Structured logging only** — use `req.log` / pino, never `console.log`.

## Testing

```sh
pnpm test:unit:run       # Vitest: unit + supertest integration (no port)
pnpm test:unit:coverage  # with v8 coverage
pnpm test:e2e            # Playwright against the built server
```

- **Unit** — pure service/middleware logic (`tests/unit/`).
- **Integration** — full middleware chain via `supertest` against `createApp()`
  (`tests/integration/`).
- **E2E** — Playwright `request` fixture against a started server (`e2e/`).

## Preparing for Deployment

**Without Docker**

```sh
pnpm build           # tsc + tsc-alias → dist/
pnpm db:deploy       # apply migrations (prisma migrate deploy)
pnpm start           # node dist/server.js
```

**With Docker**

```sh
docker build -t express-api-boilerplate .
docker run -p 3000:3000 --env-file .env express-api-boilerplate
```

**With Docker Compose (API + PostgreSQL)**

```sh
docker compose up --build
```

**CI baseline** (no CI template is bundled — wire it to your provider):

```sh
pnpm lint
pnpm typecheck
pnpm test:unit:run
pnpm build
```

## Scripts

| Script | Description |
| --- | --- |
| `dev` | Run the server with hot reload (`tsx watch`) |
| `build` | Type-check + emit to `dist/`, rewrite aliases |
| `start` | Run the built server |
| `typecheck` | `tsc --noEmit` |
| `format` | Prettier write over `src`, `tests`, `e2e` |
| `lint` / `lint:fix` | ESLint (`--max-warnings 0`) |
| `test` | Unit + integration + e2e |
| `test:unit` / `test:unit:run` | Vitest watch / single run |
| `test:unit:coverage` | Vitest with coverage |
| `test:e2e` / `test:e2e:report` | Playwright run / open report |
| `db:generate` | `prisma generate` |
| `db:migrate` / `db:deploy` | Apply migrations (dev / prod) |
| `db:studio` | Prisma Studio |
| `setup` | First-time setup (Playwright browsers) |

## Project Structure

```text
src/
├── app.ts                 # createApp(): Application — middleware + routes (no listen)
├── server.ts              # bootstrap, listen, graceful shutdown
├── config/                # env (zod, fail-fast) + pino logger
├── lib/                   # prisma singleton, HttpError
├── middlewares/           # error-handler, not-found, validate, request-logger
├── routes/                # routers (health, /api/v1)
├── controllers/           # thin request handlers
├── services/              # pure business logic
├── openapi/               # zod → OpenAPI registry + document
├── types/                 # API envelopes, Express augmentation
└── env.d.ts               # typed process.env
prisma/schema.prisma       # PostgreSQL schema (sample User model)
tests/                     # unit + integration (Vitest + supertest)
e2e/                       # Playwright API tests
```

## Installed Packages

- **Runtime:** express, helmet, cors, compression, express-rate-limit, pino,
  pino-http, zod, @prisma/client, @asteasolutions/zod-to-openapi, swagger-ui-express
- **Tooling:** typescript, tsx, tsc-alias, prisma, eslint + typescript-eslint +
  eslint-plugin-unicorn + eslint-config-prettier, prettier,
  vitest, @vitest/coverage-v8, supertest, @playwright/test

## Commit Workflow

This project uses **Conventional Commits**, enforced by Commitlint via a Husky
`commit-msg` hook. Running `git commit` in an interactive terminal launches the
Commitizen prompt (`prepare-commit-msg`).

```sh
git add .
git commit            # Commitizen prompt → conventional message
```

See `SCAFFOLD.md` to reproduce this boilerplate from scratch with an AI agent.
