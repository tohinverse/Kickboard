# Scope: Kickboard

Kickboard runs a football tournament (league, knockout, or groups into knockout) with a password gated admin area for score entry and public pages spectators watch without logging in. This pass adds a marketing website in front of it, aimed at getting organisers to create their first tournament.

**Build approach:** Journey (deliver one complete user journey, fully, before starting the next).
**Workflow:** Alpha (after `/develop`, run `/check verify` on the real app; no separate test suite or second model review unless a feature needs it). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Tournament engine & formats | Already built | existing |
| B | Admin area & score entry | Already built | existing |
| C | Spectator tournament pages | Already built | existing |
| D | Public tournament API | Already built | existing |
| 1 | Marketing look & page shell | Foundation | in-progress |
| 2 | Home landing page | Journey 1: organiser converts | planned |
| 3 | How it works page | Journey 1: organiser converts | planned |
| 4 | Features page | Journey 1: organiser converts | planned |
| 5 | Search engine & social basics | Journey 1: organiser converts | planned |
| 6 | Old links to / still reach spectators | Journey 2: spectator finds a match | planned |
| 7 | Find a tournament by name or code | Journey 2: spectator finds a match | planned |
| 8 | About and contact page | Journey 3: the site earns trust | planned |
| 9 | Privacy and terms pages | Journey 3: the site earns trust | planned |
| 10 | Visit and call to action tracking | Journey 3: the site earns trust | planned |

## Already built

Enrolled for context so later work can point at them. These predate this workflow, so `/develop` and `/sync` leave them alone.

### A. Tournament engine & formats · existing
League tables, knockout brackets, group stages feeding a knockout, and standings maths. Pure functions with their own verification script. code in `src/lib/formats/`

### B. Admin area & score entry · existing
Password gated organiser area: create a tournament, add teams, generate fixtures, enter scores, advance stages. code in `src/app/admin/`, `src/app/api/`

### C. Spectator tournament pages · existing
Public per tournament pages (overview, matches, standings, bracket) that poll for live scores on a 15 second interval with no login. code in `src/app/[tournamentId]/`

### D. Public tournament API · existing
The read only endpoint the spectator pages poll, plus the server rendered payload that seeds the first paint. code in `src/app/api/public/`, `src/lib/public-data.ts`

## Foundation

### 1. Marketing look & page shell · in-progress
A marketing voice and layout that sits beside the app's existing utility styling without fighting it: hero sections, a marketing header and footer, screenshot treatment, and where the marketing routes live so the app pages keep their own chrome.
**Done when:** marketing pages render in their own shell with app navigation kept separate, the shared primitives live in `src/components/`, and the pages read well on a phone.
spec [0001](../specs/0001-marketing-look-page-shell/index.md) · code in `src/app/(marketing)/`, `src/components/marketing/`, `src/components/RootDocument.tsx`
- [x] Design it (spec): `/architect marketing look & page shell`
- [x] Build it: `/develop marketing look & page shell`
  - [x] Split into `(marketing)` and `(app)` route groups, move the app routes and the tournament list, delete the old root layout, and verify the app surface is intact · AC-1, AC-2, AC-3, AC-13
  - [x] Add the theme tokens and build the marketing component library (layout, calls to action, hero, screenshot frame, steps, feature grid) · AC-4, AC-11, AC-12
  - [x] Build the header and footer off the one existing pages list, including the mobile panel · AC-5, AC-6, AC-8, AC-14
  - [x] Stand up the marketing root layout with its metadata, plus the landing page and the two inner pages · AC-1, AC-4, AC-9, AC-14
  - [x] Capture the screenshots, check the phone rendering, and confirm the static build output · AC-7, AC-10, AC-11
- [x] Verify it: `/check verify marketing look & page shell`

## Journey 1: organiser converts

A visitor who has never heard of Kickboard lands, understands what it does, believes it fits their tournament, and clicks through to create one. Complete with every state and the search and social polish before the next journey starts.

### 2. Home landing page · needs a decision
The page that does the selling: what Kickboard is, why it beats a shared spreadsheet, real screenshots, and one clear button into the admin area.
**Done when:** a first time visitor can tell within one screen what Kickboard does and who it is for, the main call to action reaches `/admin`, and the page renders statically and reads well on a phone.
- [ ] Design it (spec): `/architect home landing page`

### 3. How it works page · needs a decision
The flow spelled out step by step: create a tournament, add teams, pick a format, enter scores, share the public link. Answers the "will this fit my tournament" question that stops people signing up.
**Done when:** the five steps are laid out in order with a visual per step, the supported formats are named, and the page ends in the same call to action as the landing page.
- [ ] Design it (spec): `/architect how it works page`

### 4. Features page · needs a decision
Deeper detail for the organiser who is comparing options: the three formats, live scores without refreshing, no login for spectators, works on a phone at the side of a pitch.
**Done when:** each headline feature has a short honest explanation tied to something the app actually does, with no claims the product cannot back.
- [ ] Design it (spec): `/architect features page`

### 5. Search engine & social basics · needs a decision
Titles and descriptions per marketing page, a sitemap, social share cards, and static rendering so the pages load fast and index properly. Worth doing once, properly, for a site whose job is to be found.
**Done when:** every marketing page has its own title and description, a sitemap and robots file are served, a shared link shows a card with an image, and the marketing pages are statically rendered rather than forced dynamic.
- [ ] Design it (spec): `/architect search engine & social basics`

## Journey 2: spectator finds a match

Someone arrives wanting one specific tournament, not a sales pitch. They find it quickly whether they browse, search, or paste a code. This journey also clears `/` for the landing page.

### 6. Old links to / still reach spectators · needs a decision
Feature 1 performs the actual move: spec [0001](../specs/0001-marketing-look-page-shell/index.md) relocates the list to `/tournaments` and gives `/` to the landing page, because the file had to move into a route group regardless. What is left here is the aftermath: deciding what happens to a bookmarked or shared `/` link now that it lands on marketing, and sweeping every internal link and navigation target.
**Done when:** a spectator arriving at an old `/` link reaches the tournament list sensibly, no navigation anywhere points at a dead route, and the `/tournaments` empty state is intact.
- [ ] Design it (spec): `/architect old links to / still reach spectators`

### 7. Find a tournament by name or code · needs a decision
A search box and a code or link lookup so a spectator reaches their tournament without scrolling a growing list.
**Done when:** a spectator can type part of a tournament name and see matches, paste a code or link and land on that tournament, and gets a clear message when nothing matches.
- [ ] Design it (spec): `/architect find a tournament by name or code`

## Journey 3: the site earns trust

The pages that make Kickboard look like a real product someone maintains, plus knowing whether any of this works.

### 8. About and contact page
Who is behind Kickboard and how to reach you. Cheap, and its absence makes a product look abandoned.
**Done when:** the page says who runs it and gives a working way to get in touch, with no form backend needed if a link will do.
- [ ] Build it: `/develop about and contact page`

### 9. Privacy and terms pages
Plain static pages covering what the site collects and the terms of use. Needed once visitors are tracked, and expected by anyone judging whether the product is real.
**Done when:** both pages are reachable from the footer, state honestly what is collected and why, and match what the tracking feature actually does.
- [ ] Build it: `/develop privacy and terms pages`

### 10. Visit and call to action tracking · needs a decision
Know how many people land on the marketing pages and how many click through to create a tournament, so the site can be judged instead of guessed about.
**Done when:** page visits and call to action clicks are recorded and viewable, the tracking respects the privacy page's claims, and it adds no visible delay to page load.
- [ ] Design it (spec): `/architect visit and call to action tracking`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Organiser accounts and sign up**: real accounts instead of the shared admin password · needs a decision · GA
- **Pricing and paid plans**: plans, checkout, billing · needs a decision · GA
- **Waitlist email capture**: collect organisers not ready to start · needs a decision
- **Guides or blog for search traffic**: written content aimed at pulling organisers in from search · needs a decision
- **Cookie consent banner**: only if tracking uses cookies and European visitors matter · needs a decision
- **Live demo tournament link**: a stable seeded tournament visitors can click through before committing
- **Keeping the marketing screenshots current**: nothing detects a committed screenshot that has gone stale after the app UI changes · from spec 0001
- **Other languages**: translated marketing pages · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies, so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop`. The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing; **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
