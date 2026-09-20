# API routes

## Overview

Every JSON endpoint the app serves. The split that matters: `api/public/*` is
open to anyone and polled by spectators, everything else is organiser only and
guarded by the admin session cookie. Route handlers stay thin, parse the body,
check the caller, call into `src/lib/`, and shape the response.

## Key files

| File | Owns |
|---|---|
| [auth/login/route.ts](auth/login/route.ts) | Password check, then sets the admin session cookie |
| [auth/logout/route.ts](auth/logout/route.ts) | Clears the session cookie |
| [public/tournaments/[id]/route.ts](public/tournaments/[id]/route.ts) | The one open endpoint, the whole spectator payload |
| [tournaments/route.ts](tournaments/route.ts) | List and create tournaments with their stages and teams |
| [stages/[id]/generate/route.ts](stages/[id]/generate/route.ts) | Generate fixtures for one stage |
| [stages/[id]/advance/route.ts](stages/[id]/advance/route.ts) | Seed the following knockout stage from a finished group stage |
| [matches/[id]/route.ts](matches/[id]/route.ts) | Score entry, which cascades into knockout advancement |

## Conventions

- Start every non public handler with the guard, exactly this shape:
  ```ts
  const denied = await requireAdmin();
  if (denied) return denied;
  ```
  `requireAdmin` returns `null` when the caller is allowed, or a ready made 401
  response when they are not. There is no middleware doing this for you.
- Dynamic params are a promise in this version of Next.js. Type them as
  `{ params: Promise<{ id: string }> }` and `await params` inside the handler.
- Reply with `Response.json(...)`. Errors are always `{ error: "<sentence>" }`
  with a status, and the message is written for an organiser to read on screen,
  not for a developer to grep.
- Parse the body defensively: `await request.json().catch(() => null)`, then
  check each field's type. Nothing here trusts the client.
- Validation errors are 400, a missing record is 404, and a failed guard is 401.
- Business rules belong in `src/lib/tournament.ts`, which throws `Error` with a
  readable message. The handler catches it and turns it into a 400. Keep the
  rules out of the route.

## Gotchas

- The public tournament route sets both `dynamic = "force-dynamic"` and
  `revalidate = 0`, plus a `Cache-Control: no-store` header. Spectators poll it
  every 15 seconds, so any caching here shows stale scores. Do not remove them.
- `PATCH /api/matches/[id]` is not a plain update. It runs through
  `setMatchResult`, which advances the winner into the next knockout match and
  withdraws a previously advanced team when a result is corrected. Writing to
  `prisma.match` directly instead would silently skip that.
- Score, status, venue, and kick off time arrive on the same PATCH but take
  different paths: the first two go through `setMatchResult`, the last two are
  plain updates applied after, because they have no knock on effects.
- A finished knockout match cannot end level. `setMatchResult` throws, and the
  organiser is expected to enter the result after extra time or penalties.
- The advance endpoint takes the **group** stage id, not the knockout one. It
  finds the next knockout stage by `order` itself.

## Related

- Auth helpers: [../../lib/auth.ts](../../lib/auth.ts)
- Tournament rules: [../../lib/tournament.ts](../../lib/tournament.ts)
- Spectator payload shape: [../../lib/public-data.ts](../../lib/public-data.ts)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
