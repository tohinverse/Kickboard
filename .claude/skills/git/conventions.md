# Git conventions (read by `commit` and `branch`)

Project specific rules in the nearest `AGENTS.md` `## Git` block beat everything here. Read that block first. When it is silent, these are the defaults.

## Commit messages

One line subject, Conventional Commits, no prose body by default.

```
<type>(<scope>): <summary>
```

- **type**, required, one of:

  | Type | Use for |
  |---|---|
  | `feat` | new behavior a user can see |
  | `fix` | a bug fix |
  | `refactor` | restructuring with no behavior change |
  | `perf` | a change made for speed |
  | `test` | tests only |
  | `docs` | documentation only |
  | `build` | build setup, dependencies, Docker, bundler |
  | `ci` | pipeline config |
  | `chore` | housekeeping that fits nothing above |
  | `style` | formatting only, no code meaning changed |

- **scope**, optional, the area in one or two words, kebab case, taken from the feature or the folder (`auth`, `fixtures`, `standings`). Leave it off rather than inventing a vague one.
- **summary**: imperative mood (`add`, not `added` or `adds`), lower case first letter, no full stop, aim for 50 characters and stay under 72.

Good: `feat(standings): rank teams by goal difference`
Bad: `Updated some stuff in standings.ts`

### Body

Skip it. The why belongs in the spec and the PR, which is the single source for it. Write a body only when the change needs a warning that a future reader cannot get from the diff, for example a required manual migration step, or a deliberate tradeoff that looks like a mistake. Then keep it to one or two sentences, wrapped at 72 characters, separated from the subject by a blank line.

### Breaking changes

Add `!` before the colon and a `BREAKING CHANGE:` footer naming what callers must do:

```
feat(api)!: return ISO timestamps from the fixtures endpoint

BREAKING CHANGE: clients parsing epoch millis must switch to ISO 8601.
```

### Trailer

Every commit this skill writes ends with the attribution trailer, after a blank line:

```
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

Use the trailer given in the session's own instructions when one is present, it wins over this example. Never fabricate a different co author, and never add `Signed-off-by` unless the project already uses it (check with `git log`).

## Branch names

```
<prefix>/<slug>
```

- **prefix** from the change type: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`, `test/`. Match the commit type you expect to write. Default `feat/` when it is genuinely unclear.
- **slug**: kebab case, two to four words, describing the change not the ticket (`feat/group-stage-tiebreaks`, not `feat/update`). Lower case, letters digits and hyphens only.
- Keep the whole name under about 50 characters.
- If the project uses ticket ids (look for them in `git log`), put the id after the prefix: `feat/KB-42-group-stage-tiebreaks`.

Never branch with a bare name on the default branch (`main`, `master`), and never reuse a branch that is already merged.

## Reading the repo's own habits first

Before you apply any of this, run `git log --oneline -20` and look at what this repo actually does. A repo with twenty plain sentence subjects and no types is telling you its convention. Match the repo, say in one line that you did, and mention the difference from these defaults. Consistency inside the repo beats correctness against this file.
