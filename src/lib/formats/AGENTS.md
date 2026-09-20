# Tournament formats

## Overview

The pure tournament maths: who plays whom, in what order, and who is top of the
table. Nothing here touches Prisma, the network, or React, so every function is
a plain input to output transform you can test on its own. The database side
lives one level up in `src/lib/tournament.ts`, which calls into these.

## Key files

| File | Owns |
|---|---|
| [league.ts](league.ts) | Round robin pairings via the circle method, plus home and away balancing |
| [knockout.ts](knockout.ts) | Single elimination bracket: seed order, byes, and the winner to next match wiring |
| [standings.ts](standings.ts) | League table rows, sorting, and the tie break chain |

## Conventions

- Keep these modules pure. No `prisma`, no `fetch`, no React. If a function
  needs the database, it belongs in `src/lib/tournament.ts` instead.
- Teams arrive already in seed order (strongest first). Sorting by seed is the
  caller's job, `bySeed` in `src/lib/tournament.ts`.
- `buildBracket` returns matches with a `nextIndex` pointing into its own
  returned array, not a database id. The caller creates the rows in order and
  then maps index to id.
- Comment the reasoning, not the mechanics. The existing headers explain why the
  circle method works and why the seed pattern mirrors the way it does, which is
  the part that is hard to recover from the code.

## Gotchas

- An odd team count gets a `__BYE__` placeholder in `league.ts`. Filter it out
  before anything reaches the database.
- Home advantage is not seat parity. With a bye in play, parity alone pins a
  team at home for every real fixture, so the loop picks whoever has had fewer
  home games and only falls back to parity on a tie. Do not "simplify" this
  back to parity.
- A bracket always pads up to the next power of two, so `buildBracket` can
  return matches whose seats are `null`. A `null` seat is a bye, not an error.
- `computeStandings` only counts a match when it is `finished` and both teams
  and both scores are present. A live match contributes nothing.
- The tie break chain is points, then goal difference, then goals for, then the
  head to head record among the teams still level, then name. Head to head is
  computed only across the tied group, so adding a tie break earlier in the
  chain changes which teams that sub table contains.

## Tests

`npm run test:formats` runs [../../../scripts/verify-formats.js](../../../scripts/verify-formats.js),
which checks these modules directly with no database. It sweeps team counts of
2, 3, 4, 5, 8, 9, 16 and 32, so a change that only works for powers of two fails
there.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
