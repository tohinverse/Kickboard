# /git pr

Push the branch and open or update the pull request. This is the mode that leaves the machine, so it **always confirms before acting**, every run, no exceptions and no remembered approval from earlier in the session.

## 1. Read the state

```bash
git rev-parse --abbrev-ref HEAD
git status --short
git rev-parse --verify main
git log --oneline <base>..HEAD
git diff --name-only <base>...HEAD
git diff --stat <base>...HEAD
git remote
```

Note the three dots in `<base>...HEAD` for the diff. That gives you what your branch changed, not what changed on base since you left it.

Then check what tooling you have:

```bash
gh auth status
gh pr view --json number,url,state -q "."
```

Record: **GH_INSTALLED** (the `gh` commands ran rather than reporting a missing command), **HAS_REMOTE** (`git remote` printed something), **PR_EXISTS** (`gh pr view` printed a PR number). A `gh pr view` that errors or prints nothing means no PR exists yet, which is the normal case, not a failure.

## 2. Stop early when it cannot work

- **On the default branch**: do not open a PR from `main` into `main`. Say the work wants a branch and stop.
- **No commits ahead of base**: nothing to open a PR for. Say so and stop.
- **Uncommitted changes**: name them and ask, push what is committed, or commit first with `/git commit`. Do not stage or commit them yourself here, that is `commit` mode's job.
- **No remote, or `gh` missing**: you cannot open a PR. Still useful: write the title and body, show them in the chat to paste by hand, and say which piece was missing. Do not try to install anything.

Also worth one line, never a block: if `docs/reviews/` holds nothing for this branch, mention that `/check review` exists before the PR goes up. Say it once, as a note.

## 3. Write the title and body

**If the engineer handed you a body** (from `/document pr`, or pasted), use it as is. Do not rewrite it.

Otherwise write it yourself from the commits and the diff. Read the actual diff, not just the commit subjects. Keep it proportional: an everyday change gets a short body, and a short body that is true beats a long one padded with headings.

Title: one line, imperative, at most 72 characters, matching the commit convention the repo uses (`feat(standings): rank teams by goal difference`).

Body:

```markdown
## What

<one to three sentences, plain terms, what this changes>

## Why

<the motivation. Link the spec if one governs this, e.g. docs/specs/0007-....md. Reference the ticket if the branch name or commits carry one.>

## Changes

- <key change, grouped by intent, not a commit dump>
- <key change>

## How to verify

- <the steps or commands a reviewer runs>
- <what they should see>

## Risk

<blast radius, migrations, flags, rollback. "Low risk, no migrations, no flags." when that is true.>
```

Drop any section that would be empty rather than writing filler under it. Group changes by intent, a reviewer wants the story, not `git log`. Never invent verification steps, derive them from the real tests or the real behavior. Never claim a test suite passed unless you saw it pass.

For a change that deserves the long form, the fuller template lives in `/document pr`. This body is the everyday version.

## 4. Confirm, then act

Show the engineer, in the chat, all of it:

- the exact remote and branch you will push to (`origin/feat/group-stage-tiebreaks`)
- whether this creates a new PR or edits PR #N
- the base branch it targets
- the full title and body

Then **ask and wait**. Use your agent's picker (`AskUserQuestion`) or a plain question. Offer: push and open the PR, push only, edit the body first, or cancel.

Only after a yes:

```bash
git push -u origin <branch>
```

Then, by PR_EXISTS:

```bash
# no PR yet
gh pr create --base <base> --title "<title>" --body "<body>"

# PR exists
gh pr edit <number> --body "<body>"
```

Write the body to a temp file and use `--body-file` when it is long or holds characters the shell would mangle. Put that file in the session scratchpad directory, never in the project.

**Never** `--force` or `--force-with-lease`, never `gh pr merge`, never `--admin`, never add reviewers or labels the engineer did not ask for. If the push is rejected because the remote has commits you do not (someone else pushed, or you rebased), **stop**. Report exactly what git said, and let the engineer decide. Do not resolve it with a force push or a merge.

If `gh pr create` reports a PR already exists, switch to `gh pr edit` rather than failing.

## 5. Report

```
## /git pr · <PR #N opened | PR #N updated | pushed only | body below, not pushed>

<url>
<branch> → <base> · <n> commits · <n> files

<the title and body in full when nothing was pushed, so it is ready to paste>
```

Show the full body in the chat whenever `gh` could not run, that is the whole deliverable in that case.

This skill does not merge. Merging is the engineer's, through the PR.
