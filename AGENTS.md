<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kickboard

Run a football tournament (league, knockout, or groups into knockout) with a
password gated admin area for score entry and public pages spectators watch
without logging in.

## Stack

- **Language / Runtime**: TypeScript (strict), Node
- **Framework**: Next.js 16 App Router, React 19
- **Key dependencies**: Prisma 7 with the `@prisma/adapter-pg` driver adapter, Postgres, SWR, Tailwind 4
- **Package manager**: npm

## Build approach

<TBD, set by /scope>

## Commands

Docker is the supported path. Docker Desktop is the only prerequisite.

```bash
# Install / start (builds on first run, applies migrations, serves on :3000)
cp .env.example .env && ./scripts/dev.sh up

# Dev server (on the host, needs local Node and Postgres)
npm run dev

# Build
npm run build

# Test (formats + engine; the engine suite WIPES the dev database)
npm test
./scripts/dev.sh test

# Load demo tournaments
./scripts/dev.sh seed
```

`./scripts/dev.sh` also has `down`, `logs`, `shell`, `psql`, `migrate`, `prod`,
and `reset`. Adding a dependency needs a rebuild: `docker compose up -d --build`.

## Rules

- Import through the `@/` alias, which maps to `src/`. No deep relative paths.
- Server components fetch and pass data down; a sibling `*Client.tsx` marked
  `"use client"` holds the interactivity. Pages that read live data set
  `export const dynamic = "force-dynamic"`.
- Spectator pages poll on a 15 second SWR interval through `useTournament`,
  seeded with a server rendered payload so the first paint already has scores.
  There are no sockets.
- Keep tournament rules in `src/lib/`, not in routes or components. Route
  handlers parse, guard, delegate, and shape the response.
- Anything formatted against the viewer's locale or timezone renders through a
  hydration safe component (see `src/components/Kickoff.tsx`). Formatting a date
  directly in a server rendered component causes a hydration mismatch.
- Styling is Tailwind utilities inline. Shared primitives live in
  `src/components/ui.tsx`; add to that file rather than restyling per page.
- Validate every request body field's type by hand and return
  `{ error: "<readable sentence>" }` with a status. Nothing trusts the client.
- The database is reached only through the lazy `prisma` proxy in
  `src/lib/prisma.ts`, never a client you construct yourself.

## Tests

No test framework. Three plain Node scripts under `scripts/`:
`verify-formats.js` (pure, no database), `verify-engine.ts` (needs a scratch
database, deletes every row), and `verify-http.mjs` (drives a running server,
needs a `CK` admin cookie).

## Context files

- [src/lib/formats/AGENTS.md](src/lib/formats/AGENTS.md): pure tournament maths, fixtures, brackets, and standings
- [src/app/api/AGENTS.md](src/app/api/AGENTS.md): route handler conventions, the admin guard, and the public endpoint

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
