# Kickboard

Run a football tournament — league, knockout, or groups → knockout — with a
password-gated admin area for score entry and public pages spectators can watch
without logging in.

## Stack

Next.js (App Router) · TypeScript · Postgres + Prisma · Tailwind · SWR polling

## Local development

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL and ADMIN_PASSWORD
npx prisma migrate dev      # create the schema
npm run dev
```

A throwaway Postgres for local work:

```bash
docker run -d --name kickboard-pg \
  -e POSTGRES_USER=kickboard -e POSTGRES_PASSWORD=kickboard -e POSTGRES_DB=kickboard \
  -p 5432:5432 postgres:16-alpine
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
npm run test           # format algorithms + engine against a real database
npm run test:formats   # pure scheduling/standings logic, no database
npm run test:engine    # 32-team groups → knockout run against Postgres
npm run test:http      # API-level checks against a running server
```

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
