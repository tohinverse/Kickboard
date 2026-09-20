# Verify: Marketing look & page shell · spec 0001 · updated 2026-09-20
_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

Run against a production build (`npx next build && npx next start`), because two criteria
(static output, and the absence of the dev overlay) only hold there.

## UI / manual

- [x] Load `/` → the marketing header and marketing footer render; no app header, no app `Admin` text link, no `max-w-6xl ... py-6` app main → AC-1
- [x] Load `/how-it-works` and `/features` → both render the same marketing shell with a page header → AC-1, AC-14
- [x] Load `/tournaments`, `/<tournamentId>` and its standings, bracket and matches tabs, `/admin`, `/admin/tournaments/<id>` → each shows the compact app header and app footer, and no marketing header, footer or nav anywhere → AC-2
- [x] On `/tournaments` → active and completed tournaments listed newest first, each card showing team count and status, each linking to `/<tournamentId>` → AC-3
- [ ] With no live tournaments → `/tournaments` shows "No tournaments are live yet" with the admin hint → AC-3
      _Blocked on 2026-09-20: exercising this needs every tournament temporarily hidden from the
      `active`/`completed` filter, and the bulk database update was declined by a safety check.
      The code path is unchanged from before the move (`tournaments.length === 0` → `EmptyState`).
      To clear it: run it against a scratch database with no seeded tournaments._
- [x] On `/` → a hero with heading, lead paragraph, a primary action reaching `/admin` and a secondary reaching `/tournaments`, plus at least one content section below → AC-4
- [x] Marketing header → logo, a nav link for How it works and Features, a quiet Tournaments link, one primary call to action to `/admin`; the current page's link is visually marked → AC-5
- [x] At 375px wide → header links collapse into a toggled panel; the call to action stays visible beside the toggle → AC-6
- [x] At 375px → panel opens on click and closes on a second click → AC-6
- [x] At 375px → with the panel open press Escape → it closes and focus returns to the toggle → AC-6
- [x] At 375px → with the panel closed press Escape → nothing happens → AC-6
- [x] At 375px → open the panel, tap a link → the panel is closed on the destination page → AC-6
- [x] Inspect the toggle → carries `aria-expanded` tracking its state and `aria-controls="marketing-menu"` resolving to a real element even while closed → AC-6
- [x] At 375px on `/`, `/how-it-works`, `/features` → no horizontal scrolling; no text, button or image crosses the viewport edge → AC-7
- [x] Marketing footer → renders the Product group and a Tournaments link; Company and Legal are absent while their pages do not exist; every rendered link returns 200, none 404 → AC-8
- [x] `/about`, `/contact`, `/privacy`, `/terms` → linked nowhere in header or footer → AC-8, AC-14
- [x] Tab titles → `/` shows `Kickboard, run your football tournament` alone (template not applied); `/how-it-works` shows `How it works · Kickboard`; `/features` shows `Features · Kickboard`; each page has its own meta description → AC-9
- [x] `ScreenshotFrame` with a committed image → renders through `next/image` with explicit width and height → AC-11
- [x] Same frame with `placeholder` set → renders a dashed block labelled from `alt`, at the same aspect ratio, requesting no image; surrounding layout is pixel identical to the real case → AC-11
- [x] Measure white text on the primary call to action → contrast ratio at least 4.5 to 1 → AC-12
- [x] Compare `<html>` and `<body>` on `/` and `/tournaments` → identical attributes, language, font variable classes, `suppressHydrationWarning` and base classes → AC-13

## Commands

- [x] `npx next build` → `/`, `/how-it-works`, `/features` reported static (`○`); `/tournaments` reported dynamic (`ƒ`) → AC-10
- [x] `grep -rn "prisma\|force-dynamic\|next/headers" "src/app/(marketing)/"` → no code matches → AC-10
- [x] `grep -rn --include="*.tsx" --include="*.ts" -E "oklch\(|bg-green|text-green|green-[0-9]" src/` → no matches; the accent exists only as a token in `globals.css` → AC-12
- [x] `grep -rn "components/marketing" "src/app/(app)/"` → no matches; the app group imports no marketing component → AC-2
- [x] `npx eslint` → clean → build hygiene
- [x] `npm run test:formats` → ALL PASS; the engine is untouched by this feature → AC-3

## Value sourcing (one step per row, exercising the edge that breaks if the source is wrong)

- [x] Inner page tab title → comes from the page's own `metadata.title` through the `%s · Kickboard` template. Change `/features`'s title and confirm only that tab title changes → AC-9
- [x] `/` tab title → comes from the marketing root's `title.default`, rendered without the template. Confirm it never reads `... · Kickboard` → AC-9
- [x] Meta description → the page's own, falling back to the marketing root default. Remove a page's description and confirm it falls back rather than emptying → AC-9
- [x] Which nav links exist → driven by `src/components/marketing/pages.ts`. Add a page to that list and confirm it appears in both header and footer; remove it and confirm it disappears from both → AC-5, AC-8, AC-14
- [x] Which nav link is current → `usePathname()` against each href. Navigate between `/how-it-works` and `/features` and confirm the marking moves → AC-5
- [x] Panel open state → local state, reset to closed on a route change. Open it, navigate, confirm closed → AC-6
- [x] Header call to action target → fixed `/admin`. Click it and confirm arrival at the admin area → AC-4, AC-5
- [x] Footer groups → a group with no live pages is omitted, not rendered empty. Confirm Company and Legal are absent entirely → AC-8
- [x] `ScreenshotFrame` width and height → required props per usage. Confirm the rendered aspect ratio matches the declared numbers → AC-11
- [x] Placeholder switch → the `placeholder` prop set by the page, never a filesystem probe. Point a frame at a non existent file without the prop and confirm it still attempts the image rather than silently substituting → AC-11
- [x] Placeholder label → the required `alt` prop. Change `alt` and confirm the dashed block's label changes with it → AC-11
- [x] `Steps` numbering → each step's index, never passed by the caller. Reorder two steps and confirm the numbers stay 1..n in visual order → AC-4
- [x] `Button` primary background → `slate-900`, never the accent. Confirm a plain `Button` renders slate while `CtaButton` renders green → AC-12
- [x] `<body>` setup → from `RootDocument` alone. Confirm neither root layout sets fonts, imports `globals.css` or sets body classes itself → AC-13
- [x] App `<main>` → keeps `mx-auto w-full max-w-6xl flex-1 px-4 py-6`, which pins the app footer to the bottom. Load a short app page and confirm the footer sits at the bottom → AC-2
- [x] Marketing `<main>` → `flex-1` only, no width or padding, so `Section` runs full bleed. Confirm a tinted section reaches both viewport edges while its text stays aligned with the header → AC-1
- [x] `/tournaments` data → existing `Tournament` columns and `_count.teams`, query unchanged. Confirm team counts match the database → AC-3
- [x] Accent colour → `--color-accent` in `globals.css`. Change it once and confirm every call to action changes together → AC-12
- [x] Section rhythm → `--spacing-section`. Change it and confirm the gap between all marketing sections changes together → AC-12

## Acceptance-criteria coverage

- AC-1 covered by the `/` shell step, the inner pages step and the marketing `<main>` full bleed step
- AC-2 covered by the app pages chrome step, the app group import check and the app `<main>` footer step
- AC-3 covered by the list content step, the empty state step, the `/tournaments` data step and the formats suite
- AC-4 covered by the hero step, the call to action target step and the `Steps` numbering step
- AC-5 covered by the header contents step, the current link step and the pages list step
- AC-6 covered by the six panel steps (collapse, toggle, Escape, Escape while closed, close on navigate, aria attributes) and the panel state step
- AC-7 covered by the 375px no horizontal scroll step
- AC-8 covered by the footer groups step, the unlinked pages step and the footer omission step
- AC-9 covered by the tab titles step and the three metadata sourcing steps
- AC-10 covered by the build output command and the static leak grep
- AC-11 covered by the real image step, the placeholder step and the width/height, placeholder switch and label sourcing steps
- AC-12 covered by the contrast step, the colour literal grep, the `Button` slate step and the two token steps
- AC-13 covered by the document setup comparison and the `RootDocument` sourcing step
- AC-14 covered by the inner pages step, the unlinked pages step and the pages list step
