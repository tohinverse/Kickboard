# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base: pinned Node with libc6-compat, which Prisma's engines need on Alpine.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---------------------------------------------------------------------------
# deps: install node_modules once so it can be cached and reused.
# `postinstall` runs `prisma generate`, so the schema must be present.
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --legacy-peer-deps

# ---------------------------------------------------------------------------
# dev: the image used by docker compose for day-to-day work. Source is
# bind-mounted over /app at runtime, so only node_modules comes from the image.
# ---------------------------------------------------------------------------
FROM base AS dev
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------------------
# builder: produce the standalone production build.
# ---------------------------------------------------------------------------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The Prisma client is created lazily, so the build needs no DATABASE_URL.
RUN npx prisma generate && npm run build

# ---------------------------------------------------------------------------
# runner: minimal production image, run as a non-root user.
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# ---------------------------------------------------------------------------
# migrate: runs `prisma migrate deploy` against a real database. The Prisma CLI
# pulls in a deep transitive tree, so this stage keeps the full node_modules
# rather than cherry-picking packages into the slim runner.
# ---------------------------------------------------------------------------
FROM base AS migrate
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY prisma.config.ts package.json ./
CMD ["npx", "prisma", "migrate", "deploy"]
