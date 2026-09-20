# 0001. Separate marketing shell in its own route group

**Date**: 2026-09-20
**Status**: In Progress

_Decision history (context, the options weighed, and the reasoning) lives in [rationale.md](./rationale.md)._

## Summary

Kickboard is getting marketing pages in front of the app, and they need their own header, footer
and visual voice without changing how tournament pages look. The decision is to split the app into
two route groups (folders Next.js uses for organising code that do not show up in the URL),
`(marketing)` and `(app)`, each with its own root layout. Marketing keeps the app's existing slate
and white palette but gets bigger type, more breathing room and one green accent for buttons. The
feature also ships the reusable pieces (hero, section, screenshot frame, steps, feature grid) that
the later landing, how it works and features pages compose from, so no page invents its own layout.

## Requirements

**User stories**:
- As an organiser who has never heard of Kickboard, I want the marketing pages to look like a real
  product site, so that I trust it enough to read on.
- As a spectator who landed on the marketing site by accident, I want an obvious route to the
  tournament list, so that I reach my match without reading a sales pitch.
- As the engineer building the landing, how it works and features pages, I want the shell to supply
  the layout and content components, so that each page composes existing pieces instead of
  inventing its own look.
- As a spectator on a tournament page, I want nothing about those pages to change, so that the
  scoreboard I rely on stays exactly as it was.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: Marketing pages render inside a marketing only shell. `/`, `/how-it-works` and
  `/features` all show the marketing header and the marketing footer, and show neither the app
  header nor the app footer.
- **AC-2**: The app pages keep their own chrome unchanged. `/tournaments`, `/<tournamentId>`, its
  standings, bracket and matches tabs, `/admin` and `/admin/tournaments/<id>` all render the
  existing compact header and footer, with no marketing header, footer or nav visible on any of
  them.
- **AC-3**: The tournament list is served at `/tournaments` with its behaviour intact: active and
  completed tournaments listed newest first, team count and status per card, links into
  `/<tournamentId>`, and the existing empty state when none are live.
- **AC-4**: `/` serves the marketing landing page, statically rendered. It shows a hero with a
  heading, a lead paragraph, a primary call to action reaching `/admin` and a secondary action
  reaching `/tournaments`, plus at least one content section below it.
- **AC-5**: The marketing header shows the Kickboard logo, a nav link to each marketing page that
  exists (at this feature's completion: How it works and Features), a quiet Tournaments link, and
  one primary call to action reaching `/admin`. The current page's link is visually marked.
- **AC-6**: On a viewport 375px wide the marketing header collapses its links into a toggled panel,
  the primary call to action stays visible next to the toggle, the panel opens and closes on click,
  closes on Escape, closes when the route changes, returns focus to the toggle when it closes, and
  carries `aria-expanded` plus `aria-controls` on the toggle. Escape while the panel is already
  closed does nothing.
- **AC-7**: On a viewport 375px wide every marketing page reads without horizontal scrolling, and
  no text, button or image overflows the viewport.
- **AC-8**: The marketing footer renders the Product, Company and Legal groups plus a Tournaments
  link, and renders only links whose pages exist. No footer link returns a 404.
- **AC-9**: Every marketing page has its own browser tab title and a meta description. Inner pages
  follow `<Page> · Kickboard`; `/` shows the site default title on its own, without the template
  applied.
- **AC-10**: The marketing pages are statically prerendered. A production build reports `/`,
  `/how-it-works` and `/features` as static (`○`) and `/tournaments` as dynamic (`ƒ`), and no
  marketing page sets `dynamic = "force-dynamic"` or imports the `prisma` proxy. This static or
  dynamic build output is the binary form Next.js reports while `cacheComponents` is unset in
  `next.config.ts`, which is the case today; turning that flag on changes the output symbols and
  this criterion would need restating.
- **AC-11**: `ScreenshotFrame` renders a committed image through `next/image` with explicit width
  and height, and when called with its `placeholder` prop set it renders a labelled dashed block at
  the same aspect ratio instead, so the page layout is identical either way and does not shift once
  the real image lands.
- **AC-12**: The marketing accent colour and section rhythm are declared once as theme tokens in
  `src/app/globals.css`, no component hardcodes the accent colour, and white text on the primary
  call to action meets a contrast ratio of at least 4.5 to 1.
- **AC-13**: Both root layouts produce identical document setup: the same `<html>` attributes and
  language, the same font variables, the same `globals.css` import and the same `<body>`
  `suppressHydrationWarning` and base classes, supplied from one shared source rather than
  duplicated by hand.
- **AC-14**: Every link rendered by the marketing header and footer resolves to a route that exists.
  `/how-it-works` and `/features` exist and render the marketing shell with a page header, and links
  to pages not yet built are not rendered at all.

## Decision

**Chosen option**: Option 1: Route groups, each with its own root layout.

Split the app into `src/app/(marketing)/` and `src/app/(app)/`, each with its own root layout, keep
the existing slate palette with a larger type scale and one green accent for calls to action, and
ship the shell together with the reusable marketing components and thin real pages at `/`,
`/how-it-works` and `/features`.

## Feature design

**Data model sketch**:

No schema change. This feature adds no entities, fields or relationships, and runs no migration.
The moved tournament list keeps its existing read exactly as written today: `Tournament` filtered to
`status in ("active", "completed")`, ordered by `createdAt` descending, with `_count.teams`
included. The marketing pages read no data at all.

**Target file structure**:

```
src/app/
  layout.tsx                      DELETED (no top level root layout)
  globals.css                     + marketing theme tokens
  (marketing)/
    layout.tsx                    root layout: RootDocument + MarketingHeader + MarketingFooter
    page.tsx                      landing: hero + one section (static)
    how-it-works/page.tsx         page header + placeholder body (static)
    features/page.tsx             page header + placeholder body (static)
  (app)/
    layout.tsx                    root layout: RootDocument + existing app header and footer
    tournaments/page.tsx          the moved list, force-dynamic, behaviour unchanged
    [tournamentId]/               unchanged, moved only
    admin/                        unchanged, moved only
    api/                          unchanged, moved only
src/components/
  RootDocument.tsx                shared html/body/fonts/globals wrapper, used by both roots
  ui.tsx                          + Button, Container (shared primitives)
  marketing/
    pages.ts                      the one existing pages list, header and footer both read it
    MarketingHeader.tsx           "use client", disclosure panel
    MarketingFooter.tsx
    Hero.tsx
    Section.tsx
    SectionHeading.tsx
    CtaButton.tsx
    ScreenshotFrame.tsx
    Steps.tsx
    FeatureGrid.tsx
public/screenshots/               real captures, committed as they are taken
```

Route handlers under `api/` move with the app group. Their URLs are unchanged, because a route group
folder does not appear in the URL.

**Design direction** (the source of truth `/develop` builds to; there is no `design.md` and no
design tool connected, so this section is it):

| Aspect | App pages today | Marketing pages |
|---|---|---|
| Palette | `slate-50` page, `white` surfaces, `slate-900` text | identical, unchanged |
| Accent | `red` = live, `sky` = scheduled only | `--color-accent` green, calls to action only |
| Headings | `text-2xl font-semibold tracking-tight` | `text-4xl` to `text-5xl`, `sm:text-6xl` on the hero |
| Body | `text-sm` | `text-base` to `text-lg` for lead paragraphs |
| Width | `max-w-6xl` with `px-4` | full bleed section, inner `Container` at `max-w-6xl` |
| Vertical rhythm | `py-6` | `--spacing-section` between sections |
| Fonts | Geist Sans and Geist Mono | identical, unchanged |

Theme tokens added to the `@theme inline` block in `src/app/globals.css`, beside the existing font
tokens. The accent is referenced only through these tokens, never as a literal colour class, so a
later change is one edit:

| Token | Value | Use |
|---|---|---|
| `--color-accent` | `oklch(0.55 0.15 155)` | primary call to action background |
| `--color-accent-hover` | `oklch(0.48 0.15 155)` | its hover state, a darker step of the same hue |
| `--spacing-section` | `5rem` | vertical padding on a marketing section |
| `--spacing-section-lg` | `7rem` | the hero, and any section wanting extra room |

The accent is a mid green dark enough to carry white text at a contrast ratio of at least 4.5 to 1,
which AC-12 requires. Confirm the measured ratio once the shell renders and adjust the lightness
down if it falls short; the hue and the token names do not change.

**Document structure ownership** (settled here because getting it wrong breaks either the app's
footer or the marketing full bleed sections):

`RootDocument` owns exactly `<html>` (language, font variable classes, `h-full antialiased`) and
`<body>` (`suppressHydrationWarning`, `flex min-h-full flex-col bg-slate-50 text-slate-900`), and
renders its children directly inside `<body>`. It does **not** render `<main>`, a header or a footer.

Each root layout renders its own header, its own `<main>`, then its own footer. The app layout's
main keeps today's classes verbatim (`mx-auto w-full max-w-6xl flex-1 px-4 py-6`), which is what
pins the app footer to the bottom. The marketing layout's main is `flex-1` only, with no width or
padding, so `Section` can run full bleed and its inner `Container` supplies the width.

Section pattern: each `Section` is a full width band taking an optional tinted background, with an
inner `Container` holding the content, and `SectionHeading` supplying an optional small eyebrow
label, a heading and a lead paragraph. Alternating plain `white` and `slate-50` backgrounds separate
adjacent sections without borders.

**Component inventory**:

| Component | Home | Purpose | Used by |
|---|---|---|---|
| `RootDocument` | `src/components/` | the shared `<html>`/`<body>`/fonts/`globals.css` wrapper, no `<main>` or chrome | both root layouts |
| `pages.ts` | `marketing/` | the one list of marketing pages that exist | header and footer |
| `Container` | `ui.tsx` | the `max-w-6xl` inner wrapper | marketing and app |
| `Button` | `ui.tsx` | shared button primitive, variant driven | marketing and app |
| `Section` | `marketing/` | full bleed band, optional tint, section rhythm | all marketing pages |
| `SectionHeading` | `marketing/` | eyebrow, heading, lead paragraph | all marketing pages |
| `CtaButton` | `marketing/` | primary and secondary call to action | all marketing pages |
| `Hero` | `marketing/` | heading, lead, two actions, optional visual slot | landing, and lighter on inner pages |
| `ScreenshotFrame` | `marketing/` | framed `next/image`, or a labelled dashed block when passed `placeholder` | landing, how it works, features |
| `Steps` | `marketing/` | numbered steps, each with a visual | how it works |
| `FeatureGrid` | `marketing/` | feature cards in a responsive grid | features, landing |
| `MarketingHeader` | `marketing/` | client component, logo, links, Tournaments, call to action | marketing root layout |
| `MarketingFooter` | `marketing/` | link groups, existence filtered | marketing root layout |

**Component prop contracts** (settled here rather than at build time, because the landing, how it
works and features pages all compose these; an unstated contract is the drift this feature exists to
prevent):

| Component | Props |
|---|---|
| `Container` | `children`, `className?` |
| `Button` | `children`, `href?`, `variant: "primary" \| "secondary" \| "ghost"` (default `"primary"`), `className?`. Accent free: `primary` is `slate-900`, the app's existing button look. Renders a `Link` when `href` is given, else a `button`. |
| `CtaButton` | `children`, `href` (required), `variant: "primary" \| "secondary"` (default `"primary"`). Wraps `Button` and applies the accent token on `primary`. This is the only component that touches the accent. |
| `Section` | `children`, `tint?: "white" \| "slate"` (default `"white"`), `size?: "default" \| "lg"` (picks `--spacing-section` or `--spacing-section-lg`), `id?`. Full bleed band; the caller puts a `Container` inside. |
| `SectionHeading` | `eyebrow?: string`, `title: string`, `lead?: string`, `align?: "left" \| "center"` (default `"left"`) |
| `Hero` | `title: string`, `lead: string`, `primaryAction: { label: string; href: string }`, `secondaryAction?: { label: string; href: string }`, `visual?: ReactNode` (a `ScreenshotFrame` when present) |
| `ScreenshotFrame` | `src: string`, `alt: string` (required, also the placeholder's label), `width: number`, `height: number`, `caption?: string`, `placeholder?: boolean`. With `placeholder` true it renders the dashed block at the same aspect ratio and never requests the image. |
| `Steps` | `steps: { title: string; body: string; visual?: ReactNode }[]`. Numbers each step from its index, so no caller passes a number. |
| `FeatureGrid` | `features: { title: string; body: string; icon?: ReactNode }[]`, `columns?: 2 \| 3` (default `3`, collapsing to one column on a phone) |
| `MarketingHeader` | none. Reads the existing pages list and `usePathname()` itself. |
| `MarketingFooter` | none. Reads the same existing pages list. |
| `RootDocument` | `children` |

Absence of a screenshot is an explicit `placeholder` prop the page sets, not a filesystem check
inside the component. A server side `fs` probe would behave differently in the standalone build the
Dockerfile produces, and would hide a missing asset rather than declaring it.

**Metadata strings** (pinned so the two layouts and the pages agree):

- Marketing root default title: `Kickboard, run your football tournament`
- Marketing root title template: `%s · Kickboard`
- Marketing root description: `League tables, knockout brackets and live scores for your football
  tournament. Spectators watch without logging in.`
- `/` sets no title of its own, so the default renders alone, without the template.
- `/how-it-works` sets `How it works`; `/features` sets `Features`. Each sets its own description.
- The app root layout keeps the existing `title: "Kickboard"` and its current description, unchanged.

**The existing pages list** (one source, used by both the header and the footer): a single module,
`src/components/marketing/pages.ts`, exports the marketing pages that exist, each with its href,
label and footer group. The header and the footer both render from it, so a link cannot appear in one
and be missing from the other, and switching a page on when it ships is a one line edit in one file.

At this feature's completion the list holds How it works and Features. About, Contact, Privacy and
Terms are absent and therefore render nowhere; each switches on with its own scope feature.

**Marketing header contents**: logo and wordmark linking `/`; a nav link per entry in the existing
pages list, with the current page marked; a quiet `Tournaments` text link to `/tournaments`; one
primary `Create a tournament` call to action to `/admin`. On small viewports the nav links plus
`Tournaments` collapse into the toggled panel and the call to action stays beside the toggle.

**Marketing footer contents**: three link groups filled from the existing pages list, `Product`
(How it works, Features), `Company` (About, Contact) and `Legal` (Privacy, Terms), plus a
`Tournaments` link, the wordmark and the existing `live tournament scores` tagline. A group whose
pages are all absent is not rendered at all, so at this feature's completion the footer shows
`Product` and `Tournaments` only. No copyright year is rendered, which keeps a locale and clock
dependent value off a statically prerendered page.

**API surface**:

No new endpoints, route handlers or server actions. The existing handlers under `src/app/api/` move
into the app route group unchanged, and their URLs are unaffected because route group folders do not
appear in the URL. `/api/public/tournaments/[id]` and the rest stay exactly as they are.

**Asset strategy**: real screenshots of the seeded demo tournaments (`./scripts/dev.sh seed`),
captured and committed under `public/screenshots/`, rendered through `ScreenshotFrame`. Expected
captures are `standings.png`, `bracket.png`, `matches.png` and `admin-score-entry.png`. Until a file
is committed, `ScreenshotFrame` renders its labelled dashed placeholder at the declared aspect
ratio, so pages build and lay out correctly before every capture exists.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Render marketing page | inner page tab title | the page's own `metadata.title`, composed by the `%s · Kickboard` template in the marketing root layout; literal strings pinned under **Metadata strings** |
| Render `/` | its tab title | the marketing root's `metadata.title.default`, rendered alone without the template |
| Render marketing page | meta description | the page's own `metadata.description`, falling back to the marketing root default; both pinned under **Metadata strings** |
| Render marketing header | which nav links exist | the existing pages list in `src/components/marketing/pages.ts` |
| Render marketing header | which nav link is current | `usePathname()` compared against each link's `href` |
| Render marketing header | whether the panel is open | local `useState` in `MarketingHeader`, reset to closed by an effect keyed on `usePathname()` |
| Render marketing header | call to action target | fixed `/admin`, the existing admin route |
| Render marketing footer | which links and groups to render | the same existing pages list; a group with no live pages is omitted |
| Render `ScreenshotFrame` | image width and height | required props on the component, declared per usage |
| Render `ScreenshotFrame` | whether to show the placeholder | its `placeholder` prop, set by the calling page; never a filesystem probe |
| Render `ScreenshotFrame` | placeholder label | the component's required `alt` prop |
| Render `Hero` | heading, lead, action labels | props supplied by the page; the landing page's real copy is written in this feature |
| Render `Steps` | each step's number | the item's index in the `steps` prop, never passed by the caller |
| Render `Button` | the `primary` background | `slate-900`, the app's existing button look; `Button` never reads the accent token |
| Render `CtaButton` | the `primary` background | `--color-accent`, applied here and only here |
| Render `<body>` | language, fonts, base classes | `RootDocument`, the single shared source both root layouts render |
| Render app `<main>` | width and padding | the app root layout, keeping today's `mx-auto w-full max-w-6xl flex-1 px-4 py-6` |
| Render marketing `<main>` | width and padding | none: `flex-1` only, so `Section` runs full bleed and `Container` supplies the width |
| Render `/tournaments` | tournament name, team count, status | existing `Tournament` columns and `_count.teams`, query unchanged |
| Render `/tournaments` | empty state copy | the existing `EmptyState` usage, unchanged |
| Marketing accent colour | the green used by calls to action | `--color-accent` in `globals.css`, never a literal class |
| Section vertical rhythm | spacing between sections | `--spacing-section` in `globals.css` |

**Key invariants**:

- Exactly two root layouts exist and no `src/app/layout.tsx` sits above them. `/` is defined inside
  the `(marketing)` group, which the Next.js docs require when there is no top level root layout.
- No route in `(marketing)` resolves to the same URL path as one in `(app)`. Two groups producing the
  same path is a hard build error, and every later marketing page (About, Contact, Privacy, Terms)
  must be checked against the app tree before it is added.
- Both root layouts render the document through `RootDocument`, so `<html>`, `<body>`, the fonts,
  the `globals.css` import, the `suppressHydrationWarning` and the body base classes are defined
  once. Neither root layout sets any of them itself, and `RootDocument` renders no `<main>`, header
  or footer.
- No file under `src/app/(marketing)/` imports the `prisma` proxy, sets
  `dynamic = "force-dynamic"`, or reads cookies or headers. Any of those silently drops the page out
  of static prerendering.
- No marketing component is imported by a file under `src/app/(app)/`, and the app header and footer
  are imported only by the app root layout.
- Every link rendered by `MarketingHeader` or `MarketingFooter` resolves to a route that exists,
  because both render from the one existing pages list. This is a convention, not a structural
  guarantee, and that is an accepted tradeoff: a type level check costs more than it saves for a
  footer, unlike the chrome separation, where the structural form was worth the file moves.
- The accent colour appears in exactly one place, `globals.css`. `CtaButton` is the only component
  that reads the token; `Button` in `ui.tsx` stays accent free so the shared primitives file carries
  no marketing specific colour.
- Marketing pages render no date, clock or locale dependent value at all, so there is nothing to
  format and no hydration mismatch to avoid. If a later marketing page needs one, it follows the
  hydration safe pattern of `src/components/Kickoff.tsx` rather than reusing that component, which
  takes an ISO timestamp and cannot supply a value of its own.
- The `AGENTS.md` block written by `next dev` stays in the tree and is committed with this work.

**Security model**:

Every marketing page is public, static and anonymous. They read no data, accept no input, set no
cookies and hold no secrets, so there is nothing to authorise. The admin guard is untouched:
`/admin` keeps its existing password gate, and the marketing call to action only links to it. The
moved `/tournaments` page keeps the public read only posture it has today. No regulated data is in
scope for this feature; the tracking and privacy features in Journey 3 own that question.

**Configuration required**: none. No new environment variables, secrets or third party credentials.

**Edge cases and failure modes to build for**:

- *Screenshot not committed yet*: the page passes `placeholder`, and `ScreenshotFrame` renders a
  dashed block labelled with its `alt` text at the same aspect ratio as the declared width and
  height, so the page does not reflow when the real image arrives.
- *Header or footer link whose page does not exist*: the single existing pages list decides what
  renders for both; an absent page means its link is not rendered anywhere, never rendered and
  broken. A footer group whose pages are all absent is omitted rather than rendered empty.
- *A later marketing route colliding with an app route*: two route groups resolving to the same URL
  path is a hard build failure, not a silent fallback. Check the app tree before adding any new
  marketing page.
- *Crossing the two root layouts*: `/` to `/admin` and `/` to `/tournaments` are full document
  loads by design. Do not attempt to defeat this, and do not treat it as a bug in review.
- *Root layout drift*: the two roots must produce identical document setup, which `RootDocument`
  enforces structurally. Neither root layout defines fonts, imports `globals.css` or sets body
  attributes on its own.
- *Static rendering leak*: a marketing page importing `prisma`, setting `force-dynamic`, or reading
  cookies or headers drops it out of prerendering silently, with no error. The build output is the
  check. The moved `/tournaments` page keeps its `force-dynamic` and stays dynamic on purpose.
- *Mobile panel left open across navigation*: the panel closes on route change and on Escape, so a
  link tap does not leave it covering the destination page.
- *Deep link straight to an inner marketing page*: `/features` reached directly renders the full
  shell with correct metadata, since nothing depends on having passed through `/` first.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: a visitor loads `/`, sees the marketing header, hero and a content section, clicks
  `Create a tournament` and arrives at `/admin`, verifies **AC-1**, **AC-4**, **AC-5**.
- App isolation: a spectator loads `/<tournamentId>/standings` and sees the existing app header,
  footer and match tabs with no marketing chrome anywhere on the page, verifies **AC-2**.
- Moved route: `/tournaments` lists active and completed tournaments with team counts and links into
  each, and shows the existing empty state when none are live, verifies **AC-3**.
- Mobile: at 375px the header collapses, the panel toggles open and closed, closes on Escape, closes
  after a link tap, and no marketing page scrolls horizontally, verifies **AC-6**, **AC-7**.
- Failure case: `ScreenshotFrame` pointed at an uncommitted file renders its labelled placeholder at
  the correct aspect ratio and the surrounding layout is identical to when the image is present,
  verifies **AC-11**.
- Footer integrity: every link the footer renders resolves to an existing route, and the unbuilt
  Journey 3 pages are absent rather than broken, verifies **AC-8**.
- Static rendering: a production build reports `/`, `/how-it-works` and `/features` as static, and
  each page's tab title follows `<Page> · Kickboard`, verifies **AC-9**, **AC-10**.
- Shell consistency: both root layouts produce the same `<html>` attributes, font variables and body
  attributes, from `RootDocument`, verifies **AC-13**.
- Tokens: the accent colour and section spacing resolve from `globals.css` theme tokens, and no
  marketing component contains a literal accent colour class, verifies **AC-12**.
- No dead links: every link in the marketing header resolves, with `/how-it-works` and `/features`
  rendering the shell and a page header rather than a 404, verifies **AC-14**.

## Build plan

The project's approach is Journey, so this Foundation feature completes the shell as one whole
before Journey 1 starts, and deliberately stops short of the page content that Journey 1 owns. The
ordering front loads the structural move (which touches the most files and is the only step that can
break existing pages) and verifies the app surface is intact before any marketing work begins, so a
regression is caught while the diff is still small.

1. [x] Add the four marketing theme tokens to the `@theme inline` block in `src/app/globals.css`, at the
   values pinned in the design direction table, and confirm the measured contrast of white text on
   `--color-accent` is at least 4.5 to 1, satisfies **AC-12**.
2. [x] Extract `src/components/RootDocument.tsx` from the current `src/app/layout.tsx`: the `<html>`
   element with its language and font variable classes, the `<body>` with
   `suppressHydrationWarning` and its base classes, and the `globals.css` import, keeping the
   existing comment explaining the hydration suppression. It renders `children` directly and no
   `<main>`, header or footer, satisfies **AC-13**.
3. [x] Create `src/app/(app)/layout.tsx` as a root layout rendering `RootDocument`, then the existing app
   header, its `<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">` and footer, all lifted
   verbatim from the current root layout, plus its existing `metadata`, satisfies **AC-2**,
   **AC-13**.
4. [x] Move the app routes into the group: `src/app/[tournamentId]/`, `src/app/admin/` and
   `src/app/api/` become `src/app/(app)/[tournamentId]/`, `src/app/(app)/admin/` and
   `src/app/(app)/api/`, contents unchanged, satisfies **AC-2**.
5. [x] Move the tournament list from `src/app/page.tsx` to
   `src/app/(app)/tournaments/page.tsx`, keeping its query, `force-dynamic`, cards and empty state
   exactly as written, satisfies **AC-3**.
6. [x] Delete the top level `src/app/layout.tsx`, satisfies **AC-1**, **AC-2**.
7. [x] Verify the app surface is unchanged before touching marketing: `/tournaments`,
   `/<tournamentId>` and its four tabs, `/admin` and `/admin/tournaments/<id>` all render as before
   with the footer still pinned to the bottom, and the API routes respond at their unchanged URLs,
   satisfies **AC-2**, **AC-3**.
8. [x] Add the shared primitives `Container` and `Button` to `src/components/ui.tsx`, at the prop
   contracts pinned in the design section. `Button` stays accent free, satisfies **AC-4**, **AC-5**.
9. [x] Build the layout and call to action core in `src/components/marketing/`: `Section`,
   `SectionHeading` and `CtaButton`, at their pinned prop contracts. `CtaButton` is the only
   component reading the accent token, satisfies **AC-4**, **AC-12**.
10. [x] Build `ScreenshotFrame` with `next/image`, required explicit width and height, and the
    `placeholder` prop rendering the dashed block labelled from `alt` at the declared aspect ratio,
    satisfies **AC-11**.
11. [x] Build `Hero`, `Steps` and `FeatureGrid`, so the Journey 1 pages compose rather than invent,
    satisfies **AC-4**.
12. [x] Create `src/components/marketing/pages.ts`, the single existing pages list (href, label, footer
    group) holding How it works and Features, satisfies **AC-5**, **AC-8**, **AC-14**.
13. [x] Build `MarketingHeader` as a client component: logo, a nav link per entry in that list with the
    current one marked, the Tournaments link, the primary call to action, and the mobile disclosure
    panel with `aria-expanded`, `aria-controls`, Escape handling, close on route change and focus
    returned to the toggle on close, satisfies **AC-5**, **AC-6**.
14. [x] Build `MarketingFooter` from the same list: the three link groups with empty groups omitted, the
    Tournaments link, the wordmark and the tagline, and no copyright year, satisfies **AC-8**,
    **AC-14**.
15. [x] Create `src/app/(marketing)/layout.tsx` as the second root layout: `RootDocument`, then the
    marketing header, a `<main className="flex-1">` with no width or padding, and the footer. Set the
    pinned default title, title template and description, and no `force-dynamic`, satisfies
    **AC-1**, **AC-9**, **AC-10**.
16. [x] Create `src/app/(marketing)/page.tsx`: a real hero with real copy, a primary call to action to
    `/admin`, a secondary to `/tournaments`, and one content section below. It sets no title, so the
    default renders alone, satisfies **AC-4**, **AC-9**.
17. [x] Create `src/app/(marketing)/how-it-works/page.tsx` and
    `src/app/(marketing)/features/page.tsx` with a page header and placeholder body each, plus their
    own pinned title and description, so no nav link is dead, satisfies **AC-9**, **AC-14**.
18. [x] Capture the demo screenshots from the seeded tournaments and commit them under
    `public/screenshots/`, wiring the landing page's frame to a real one and dropping its
    `placeholder` prop, satisfies **AC-11**.
19. [x] Check the phone rendering of every marketing page at 375px: no horizontal scroll, no overflow,
    and the header panel behaving as specified, satisfies **AC-6**, **AC-7**.
20. [x] Run a production build and confirm `/`, `/how-it-works` and `/features` are reported static
    (`○`) while `/tournaments` stays dynamic (`ƒ`), satisfies **AC-10**.

## Consequences

**Positive**:
- The two surfaces cannot contaminate each other. Marketing chrome on a tournament page becomes
  structurally impossible rather than a review catch.
- Journey 1's three page features become composition work against a recorded design direction, not
  three independent invention exercises.
- Marketing pages start out statically prerendered, so the search and social feature builds on a
  foundation that already renders correctly instead of unpicking `force-dynamic` from every page.
- The accent colour and section rhythm live in one file, so a visual change is one edit rather than a
  sweep.
- The app group can keep whatever request time behaviour it needs without ever affecting the
  marketing pages' static rendering.

**Negative / tradeoffs**:
- Navigating between the marketing site and the app is a full document load, not a client
  navigation. This is inherent to multiple root layouts and cannot be optimised away while this
  structure stands.
- Two root layouts mean the document setup must stay identical in both. `RootDocument` reduces that
  to a shared component, but the obligation is real and a future edit to one layout only can still
  break the symmetry.
- The move touches nearly every route file. The diff is large, git history for those files records a
  rename, and any in flight branch touching `src/app/` will conflict.
- This feature takes over work the Journey 2 scope row nominally owned (moving the tournament list),
  so that row shrinks and the scope must be updated to match, or the two records disagree.
- Marketing pages will exist with placeholder bodies at `/how-it-works` and `/features` until
  Journey 1 fills them. They are honest stubs, but they are stubs, and shipping them means the site
  has thin pages for a while.
- Committed screenshots are a maintenance obligation: they go stale silently whenever the app's UI
  changes, and nothing enforces recapture.

**Neutral**:
- No database change, no migration, no new environment variable and no new dependency.
- Route group folders do not appear in URLs, so every existing public URL and API path is unchanged
  by the move.
- `src/components/marketing/` is a new convention for this repo, which currently keeps components
  flat in `src/components/`. It is worth a line in `AGENTS.md`, which `/sync` owns.
- The marketing header joins `PublicNav.tsx` as the second client component used for navigation,
  consistent with the existing pattern.

## Follow-up

- [ ] Update scope feature 6 (`Tournament list moves to /tournaments`) to reflect that this feature
      performs the move, leaving that row the redirect behaviour for old `/` links and the internal
      link sweep. Without this the two records disagree about who moved the list.
- [ ] Decide the redirect posture for old links to `/`. This feature makes `/` the landing page,
      which is not an error for anyone, but a spectator with a bookmarked `/` now lands on marketing
      rather than the list. Scope feature 6 owns the decision; the landing page's secondary call to
      action to `/tournaments` is the interim answer.
- [ ] Record the `src/components/marketing/` convention and the two root layout structure in the
      root `AGENTS.md` `## Rules`, since they change where new components and pages go for every
      later task. `/sync` owns that file.
- [ ] Write the real copy for the landing hero and its first section. This feature ships real copy
      rather than lorem, so the words are part of the build; the landing page feature deepens them.
- [x] Capture and commit the demo screenshots, and decide who recaptures them when the app UI
      changes. Nothing currently detects a stale screenshot.
      **Captured during the build**: `standings.png`, `bracket.png`, `matches.png` and
      `admin-score-entry.png` under `public/screenshots/`, taken from the seeded demo tournaments
      against a production build. Who recaptures them is still open, and stays on the scope's
      deferred list.
- [x] Confirm the measured contrast of white text on `--color-accent` once the shell renders. The
      token value is pinned in the design direction table and chosen to clear 4.5 to 1; if the
      measurement falls short, lower its lightness and keep the hue and the token name.
      **Done during the build**: the pinned `oklch(0.55 0.15 155)` measured 4.45 to 1, just short of
      4.5, so the lightness was lowered to `0.52` (measured 5.01 to 1) and the hover step to `0.45`
      (6.65 to 1). Hue and token names unchanged, exactly as this item directed.
- [ ] Watch for a later marketing page colliding with an app route path. Two route groups resolving
      to the same URL is a build error, and About, Contact, Privacy and Terms are all still to come.
