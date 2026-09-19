# Kickboard

Run a football tournament — league, knockout, or groups → knockout — with a
password-gated admin area for score entry and public pages spectators can watch
without logging in.

## Stack

Next.js (App Router) · TypeScript · Postgres + Prisma · Tailwind · SWR polling

## Quick start (Docker)

Docker Desktop is the only prerequisite — no local Node or Postgres needed.

```bash
cp .env.example .env
./scripts/dev.sh up
```

That builds the image, starts Postgres, applies migrations, and serves the app
at <http://localhost:3000>. Load some demo tournaments to click through:

```bash
./scripts/dev.sh seed
```

Sign in at `/admin` with the `ADMIN_PASSWORD` from your `.env`
(`local-dev-password` by default).

### Everyday commands

| Command | What it does |
| --- | --- |
| `./scripts/dev.sh up` | Start the stack (builds on first run) |
| `./scripts/dev.sh down` | Stop it, keeping the database |
| `./scripts/dev.sh logs` | Follow the app logs |
| `./scripts/dev.sh shell` | Shell into the app container |
| `./scripts/dev.sh psql` | `psql` against the dev database |
| `./scripts/dev.sh migrate` | Create a new migration (prompts for a name) |
| `./scripts/dev.sh seed` | Load demo tournaments |
| `./scripts/dev.sh test` | Run the test suite — **wipes the dev database** |
| `./scripts/dev.sh prod` | Run the production image locally on port 3001 |
| `./scripts/dev.sh reset` | Destroy everything, database included |

Source is bind-mounted, so edits on the host hot-reload in the container
(about two seconds). `node_modules` and `.next` live in named volumes, so the
container's Linux builds never collide with the host's macOS ones — which also
means **adding a dependency needs a rebuild**:

```bash
docker compose up -d --build
```

Database contents survive `down`/`up` in the `db-data` volume. Only `reset`
removes them.

### Checking a production build

```bash
./scripts/dev.sh prod        # http://localhost:3001
./scripts/dev.sh prod-down
```

This builds the standalone runner image (339MB vs 630MB for dev), runs as a
non-root user, and uses its own database on port 5433 — so it never touches
your dev data. It is the closest local equivalent to what Vercel serves.

## Running without Docker

Node 22+ and a local Postgres are required.

```bash
npm install
cp .env.example .env         # uncomment the localhost DATABASE_URL line
npx prisma migrate dev
npm run dev
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled connection used at runtime |
| `DIRECT_DATABASE_URL` | for migrations | Direct (non-pooled) URL; on Vercel/Neon this is `POSTGRES_URL_NON_POOLING` |
| `ADMIN_PASSWORD` | yes | The single shared organiser password |
| `ADMIN_SESSION_SECRET` | recommended | Signs the admin cookie; falls back to `ADMIN_PASSWORD` |

## Tests

```bash
./scripts/dev.sh test       # inside Docker (wipes the dev database)
```

Or directly:

| Command | Scope |
| --- | --- |
| `npm run test:formats` | Scheduling and standings logic, no database |
| `npm run test:engine` | 32-team groups → knockout run against Postgres |
| `npm run test:http` | API-level checks against a running server |

`test:engine` truncates every table, so it refuses to run against a database
holding unrelated data. Point `DATABASE_URL` at a scratch database, or set
`ALLOW_DESTRUCTIVE_TEST=1` to override. On the host use
`npm run test:engine:host`, which loads `.env` first.

## Formats

- **League** — round-robin by the circle method; odd fields get a bye round.
  Standings sort by points → goal difference → goals for → head-to-head.
- **Knockout** — single elimination, seeded 1 v N with the bracket padded to
  the next power of two. Byes fall to the top seeds, and every round is created
  up front with `nextMatchId` wired so a result advances the winner
  automatically. Editing or clearing a result withdraws the team it advanced.
- **Groups → Knockout** — configurable group size (32 teams → 8 groups of 4),
  round-robin inside each group, then a bracket seeded from the top N per
  group. Qualifiers are arranged so no round-one tie is a group rematch.

## Usage

1. Sign in at `/admin` with `ADMIN_PASSWORD`.
2. Create a tournament: name, format, and one team per line (order sets seeding).
3. Generate fixtures for the stage.
4. Enter scores as matches finish — mark them **Live** or **Final**.
5. For groups → knockout, press **Advance to knockout** once every group match
   is final; the bracket is seeded from the tables.
6. Set the tournament **active** so it appears on the public home page.

Public pages (`/[tournamentId]`, `/standings`, `/bracket`, `/matches`) are
server-rendered and then poll every 15 seconds.

## Deploying to Vercel

```bash
npm i -g vercel
vercel login
./scripts/deploy.sh
```

The script links the project as `kickboard`, prompts for `ADMIN_PASSWORD` and
`ADMIN_SESSION_SECRET`, runs the migration against your database, and deploys
to production. Provision Postgres first from the Vercel dashboard (Storage tab)
so `DATABASE_URL` is available.
