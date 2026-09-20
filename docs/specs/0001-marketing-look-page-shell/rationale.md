# 0001 · Rationale

_Decision history for [0001](./index.md): the context, the options considered and the reasoning. Not build input._

## Context

Everything in the repo today is one surface. A single root layout at `src/app/layout.tsx` owns
`<html>`, `<body>`, the Geist fonts, `globals.css`, and a compact utility header and footer that
suit a scoreboard: `max-w-6xl`, `py-6`, `text-2xl` headings, slate on white. That chrome wraps the
tournament pages, the admin area and the tournament list at `/` alike.

The scope now adds a marketing website in front of it, aimed at organisers who have never heard of
Kickboard. That work needs the opposite of a scoreboard: large type, full width sections, generous
vertical rhythm, a nav pointing at sales pages rather than match tabs, and a persistent call to
action. Nine features across three journeys depend on this shell existing, and three of them (the
landing page, how it works, features) are page builds that will each need the same hero, section
and screenshot treatment. If the shell does not define those pieces, each page invents them and the
site drifts visually page by page.

Two constraints from the existing code shape the choice. First, the app's chrome cannot change:
spectators use the tournament pages at the side of a pitch and the scope's done when clause for
this feature is explicit that app navigation stays separate. Second, `/` is currently the tournament
list and it queries the database with `dynamic = "force-dynamic"`, while the marketing pages must
prerender statically so they load fast and index properly. The landing page wants `/`, which means
the front door has to change hands.

There is no design source in the repo: no `design.md`, no screenshots, no images at all. Without a
recorded direction, `/develop` would be choosing a type scale and an accent colour three separate
times across three page features.

## Options considered

### Option 1: Route groups, each with its own root layout (recommended)

Delete the top level `src/app/layout.tsx`. Move the app's routes under `src/app/(app)/` and the
marketing routes under `src/app/(marketing)/`, and give each group its own root layout owning
`<html>`, `<body>`, fonts and its own chrome. Shared document setup is factored into one module both
layouts call, so they cannot drift.

**Pros**:
- Hard separation. Marketing chrome physically cannot render on a tournament page, and the app
  header cannot render on the landing page. AC-1 and AC-2 hold by construction, not by discipline.
- Each group owns its own rendering posture. The app group keeps `force-dynamic` where it needs it;
  the marketing group stays static with nothing above it forcing dynamic rendering.
- Metadata splits cleanly: the marketing root sets the marketing title template and description
  without touching the app's.

**Cons**:
- Crossing the two groups causes a full page load rather than a client navigation, so `/` to
  `/admin` and `/` to `/tournaments` reload the document.
- No single root layout means document setup (fonts, `globals.css`, the `<body>` attributes) exists
  in two files and must be kept identical, which is why AC-13 exists.
- Moves nearly every route file, so the diff is large and git history for those files gets a rename.

### Option 2: One root layout, chrome swapped in nested group layouts

Keep `src/app/layout.tsx` owning `<html>`, `<body>`, fonts and `globals.css`, but strip its header
and footer. Each route group layout below it supplies its own chrome.

**Pros**:
- Document setup lives in exactly one file, so the AC-13 drift risk disappears.
- All navigation stays client side, including marketing to app, because there is one root layout.

**Cons**:
- The single root is a shared choke point: anything it ever needs to read at request time (a cookie,
  a header) would opt the marketing pages out of static prerendering along with everything else.
- The separation is a convention rather than a guarantee. Nothing stops a future edit putting
  marketing chrome back in the root, where it would reappear on every tournament page.
- Still moves the same route files into groups, so it does not actually buy a smaller diff.

### Option 3: Marketing in a plain nested folder, app routes untouched

Leave the root layout and every existing route exactly where it is, and add marketing pages in an
ordinary folder with a nested layout.

**Pros**:
- Smallest possible diff. No file moves, no route group, no risk to the app pages.

**Cons**:
- The app header still wraps marketing pages, because the root layout renders it. Removing it from
  the root to fix that breaks every app page, so AC-1 and AC-2 cannot both hold.
- The landing page cannot sit at `/` without the same surgery this option was trying to avoid, which
  blocks the landing page feature.

### Option 4: One shell for everything, restyled

Make the existing header and footer serve both surfaces, adding marketing links to them.

**Pros**:
- Least code by a wide margin, and one chrome to maintain.

**Cons**:
- A marketing voice is impossible without changing how every tournament page looks, which the
  scope's done when clause rules out directly.
- Puts sales navigation in front of spectators mid match, which serves neither audience.

## Rationale

The deciding force is the scope's requirement that app navigation stays separate. Option 2 achieves
that by convention and Option 1 achieves it structurally, and for chrome that spectators depend on
mid match, structural wins. The second force is static rendering: the marketing pages exist to be
found and to load fast, and a shared root layout is a standing risk to that, since a request time
read in the root itself would drop every page beneath it out of prerendering. Option 1 removes
that coupling entirely. Options 3 and 4 both fail an acceptance criterion outright rather than
trading off against it, so neither is viable.

The full page load between groups is the real cost, and it is the right cost to pay here. The
crossings are `/` to `/admin` (an organiser converting, once) and `/` to `/tournaments` (a
spectator who landed wrong, once). Neither is a repeated interaction, and both feel like arriving
somewhere new, which is what a document load looks like anyway. Inside each group navigation stays
client side, so browsing the marketing pages and flipping between match tabs are both unaffected.

Moving the tournament list to `/tournaments` in this feature rather than leaving it to the Journey 2
feature that nominally owns it is a sequencing call. The file has to move into a route group here
regardless, and leaving it at `/` would block the landing page behind a feature two journeys away.
This feature therefore performs the move and the Journey 2 feature keeps the redirect and the link
sweep, which is noted on its scope row.

On the look, keeping the slate palette was preferred over a distinct marketing brand because the
full page load already marks the boundary between surfaces and a second palette would make that
seam louder rather than quieter. Green was chosen for the accent because the app has already spent
red on live and sky on scheduled, so green is the one energetic colour left that cannot be misread
as a match state.

Two calls made here rather than asked. The shared document setup is factored into a single module
(a small component wrapping `<html>` and `<body>` with the fonts, the `globals.css` import and the
`suppressHydrationWarning`) that both root layouts render, because two hand kept copies of that
setup will drift and the drift is invisible until a font fails to load on one surface only; the
runner up was a documented convention to keep them in sync, rejected as unenforceable. The
marketing header is a client component, following the pattern `src/components/PublicNav.tsx`
already sets in this repo, because it needs local state for the panel and `usePathname` to mark the
current page; the runner up was a CSS only disclosure with a hidden checkbox, which keeps the page
free of client JavaScript but is harder to make properly accessible and would be the only component
in the repo built that way.
