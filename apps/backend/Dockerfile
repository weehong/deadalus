# syntax=docker/dockerfile:1
# Multi-stage build for the Express API.
#
# NOTE: the build context is the WORKSPACE ROOT, not this directory — the pnpm
# lockfile and workspace manifest live there and a reproducible install needs
# them. Build with:
#   docker build -f apps/backend/Dockerfile .        (from the repo root)
# or via apps/backend/docker-compose.yml, which sets the context accordingly.

FROM node:22-alpine AS base
RUN npm install -g pnpm@11
WORKDIR /repo

# --- Install dependencies ---
# Manifests are copied on their own first so this layer caches across source
# edits. `--filter @daedalus/backend...` restricts the install to this app and
# its workspace dependencies, skipping the frontend entirely.
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install --frozen-lockfile --filter @daedalus/backend...

# --- Build the application ---
FROM deps AS builder
COPY apps/backend apps/backend
RUN pnpm --filter @daedalus/backend exec prisma generate
RUN pnpm --filter @daedalus/backend run build

# --- Flatten to a production-only tree ---
# `pnpm deploy` produces a self-contained directory with a real (non-symlinked)
# node_modules, which is what makes a slim runtime image possible. Prisma's
# generated client is copied in afterwards: it is produced inside the builder's
# virtual store (under a version-hashed directory, hence the glob) and the
# deploy step does not carry it across.
FROM builder AS deploy
RUN set -eu; \
	pnpm --filter @daedalus/backend deploy --legacy --prod /app; \
	cp -R /repo/apps/backend/dist /app/dist; \
	# The client must land inside the deployed virtual store, next to the
	# @prisma/client package that resolves it — not at the node_modules root.
	src="$(ls -d /repo/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma)"; \
	dst="$(ls -d /app/node_modules/.pnpm/@prisma+client@*/node_modules)"; \
	cp -R "$src" "$dst/"; \
	test -f "$dst/.prisma/client/index.js"

# --- Production runner ---
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 nodeapp

COPY --from=deploy --chown=nodeapp:nodejs /app ./

USER nodeapp
EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
	CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
