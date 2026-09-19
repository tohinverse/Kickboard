# /git commit

Turn what you changed into well named commits. Acts, no permission needed, because nothing leaves the machine. Show the message, then commit.

## 1. Read the real state

Run these and read the output before you decide anything:

```bash
git status --short
git diff --stat
git diff
git diff --staged
git log --oneline -20
git rev-parse --abbrev-ref HEAD
```

Read the actual diff, not just the file names. A message written from file names alone is a guess, and it will be wrong in the way that matters: it will describe where the change is instead of what it does.

`git log --oneline -20` is not optional. It tells you the repo's real message convention, which beats the defaults in `conventions.md`.

## 2. Handle what you found before writing anything

**Nothing to commit** (clean tree): say so and stop. Offer `/git pr` if the branch is ahead of base.

**On the default branch** (`main` or `master`) with changes: do not commit here. Say the work wants a branch, recommend `/git branch`, and stop. If the engineer says commit on main anyway, do it, it is their repo.

**Something staged already**: respect it. They staged that on purpose. Commit the staged set as its own commit and ask before touching the rest.

**A secret, a `.env`, a credential, a key, a large binary, or an unexplained lockfile change** is in the diff: stop. Name the file, say why it worries you, and wait. Never commit it as part of a batch and mention it afterwards.

**Something looks half done** (a stray `console.log`, a `TODO` you just wrote, a commented out block, a failing obvious edit): flag it in one line before committing. Do not clean it up yourself, this skill does not edit code.

## 3. Group the changes

One commit per intent, not one commit per session. Read the diff and ask what changes would a reviewer want to read separately.

Split when the diff holds clearly separate intents: a fix and an unrelated refactor, a feature and a dependency bump, code and an unrelated docs edit. Then stage each group by path and commit it on its own:

```bash
git add <paths for group one>
git commit -m "<subject>" -m "<trailer>"
```

Keep it as one commit when the parts only make sense together: the change, its test, and the type it needed. A test that exists to prove the fix belongs with the fix.

Do not split so finely that a commit cannot build or would not pass typecheck on its own. A commit is a point someone could check out.

If the engineer steered you (`/git commit only the auth files`), honor that and commit only those paths.

## 4. Write the message

Follow `conventions.md`, or the repo's own habit where it differs, or the `AGENTS.md` `## Git` block where it speaks. Subject line, imperative, typed and scoped, plus the attribution trailer.

Prefer `-m` twice over a heredoc, it behaves the same on every OS:

```bash
git commit -m "feat(standings): rank teams by goal difference" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

Describe what the change does for the codebase, not what you did. `fix(fixtures): keep kick off times stable across render` beats `fix: fixed the bug I found`.

Never use `--amend` on a commit that is already pushed. Check with `git log --oneline origin/<branch>..HEAD` when you are unsure whether it was.

## 5. Confirm it landed

```bash
git log --oneline -<n>
git status --short
```

If a commit failed, most often a pre commit hook rejected it, report the hook's actual output. Do not retry with `--no-verify` to get around it, and do not silently drop the failing part. A hook that blocks is the project talking.

## 6. Report

One short block:

```
## /git commit · <n> commit(s) on <branch>

<type>(<scope>): <subject>          <n> files
<type>(<scope>): <subject>          <n> files

<anything you flagged and did not commit, or left alone>
Next: /git pr to push and open the pull request.     (only when the branch is ahead of base)
```

Do not push. Do not offer to push as an action, only name it as the next thing they may choose to run.
