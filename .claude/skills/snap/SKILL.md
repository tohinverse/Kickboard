---
name: snap
allowed-tools: Bash, Read, AskUserQuestion
argument-hint: "[type] [scope] (optional, e.g. fix standings)"
description: "Run /snap to commit and push the current changes using this project's commit rules. Reads the diff, picks the type from the branch name, branches off main first when you are on it, writes a Conventional Commit with a bullet body, commits, and pushes. One command from dirty tree to pushed branch."
---

## Output style (plain words, no dashes, no hyphens)

<!-- OUTPUT-STYLE:START -->
Write everything this skill produces, files and messages alike, in plain simple language. Talk to the reader as `you`, warm and direct like a colleague, and present every step as a recommendation they may run or skip, never an order. Keep technical terms that carry real meaning; explain each in plain words. Never use a dash or a hyphen as punctuation: no em dash, no en dash, and no hyphenated compounds. Write `read only`, not `read-only`. Say it in simple words, or reword the sentence. Code, file paths, command flags, and values other skills match on keep their hyphens. Use short sentences, commas, or parentheses. Clear beats clever.
<!-- OUTPUT-STYLE:END -->

## What this skill does

**Your role:** the engineer who finishes the job. The work is done and the tree is dirty; you take it from there to a pushed branch without a conversation about it. You read the actual diff before you name it, you never commit to the default branch, and you never push something you did not just inspect.

One command, dirty tree to pushed branch:

```
inspect → type and scope → branch if on main → message → commit → push → report
```

`$ARGUMENTS` may carry a type and a scope (`/snap fix standings`). When given, they win over anything you would infer.

This writes **real history**, meant to survive into a PR. It is not a scratch checkpoint.

## Asks vs acts

**Acts, including the push.** This is the deliberate exception to the confirm before outward rule that `/git` follows. You asked for a one shot command, so the push is part of the shot. Never `--force` or `--force-with-lease`, in any circumstance.

Three things stop it, each a case where guessing would do damage:

1. **Stray files in the diff**, things you did not mention or that look unrelated. Surface them and wait rather than sweeping them in.
2. **A secret in the diff.** Committing a credential writes it into history and the push puts it on the remote, where it must be treated as burned.
3. **The type is genuinely ambiguous** and no signal resolves it (Step 2). Ask rather than guess between `fix` and `improvement`.

Otherwise say nothing beyond the report. Do not comment on code quality, do not suggest cleanups.

**Never** rewrites history, force pushes, resets, rebases, merges, or deletes anything.

## Execution

### 1. Inspect before committing

Run these and **read** the output:

```bash
git status --short
git diff --stat HEAD
git diff HEAD
git branch --show-current
```

`git diff HEAD` shows staged and unstaged together. Untracked files appear only in `git status --short`, so read both.

**Nothing to commit**: say `Nothing to snap, tree is clean.` and stop.

**Not a git repo**: say so and stop. Do not run `git init`.

**Stray or unrelated files**: if the diff touches files the engineer did not mention, or that look unrelated to the work at hand, **stop and surface it**. Name the files and ask whether to include them. Do not commit blindly.

**Secrets**: stop if you see a `.env`, `.env.local`, or `.env.production` that git does not already track (check `git ls-files` first, a tracked `.env.example` is fine), a private key (`.pem`, `.key`, `id_rsa`, `.p12`), or an added line with a real looking credential: a long random string assigned to a name containing `secret`, `token`, `password`, `apikey`, `api_key`, or `credential`, or a known prefix (`sk-`, `ghp_`, `AKIA`, `AIza`, `xoxb-`, a PEM `BEGIN` header). A placeholder like `API_KEY=your-key-here` is not a secret, keep going. When you stop, name the file and line, and say that a push would put it on the remote for good.

### 2. Determine type and scope

**Base standard: Conventional Commits**, plus two project extensions (`improvement`, `security`). There is **no** `hotfix` type, an urgent fix is a `fix` with the urgency noted in the body.

| type | when |
|---|---|
| `feat` | a new feature or capability |
| `fix` | a bug fix (also urgent or production fixes, note urgency in the body) |
| `docs` | documentation only |
| `style` | formatting or whitespace, no change to what the code means |
| `refactor` | restructuring with no behavior change |
| `perf` | a change that improves performance |
| `test` | tests only |
| `build` | build system or dependencies |
| `ci` | pipeline configuration |
| `chore` | maintenance, no source or test change |
| `revert` | reverts a previous commit |
| `improvement` | *(project extension)* enhancing existing behavior where `perf` and `refactor` do not fit |
| `security` | *(project extension)* a security patch |

**Breaking changes**: append `!` after the type and scope (`feat(api)!: ...`) **and** add a `BREAKING CHANGE: <description>` footer.

#### Choosing the type, the branch name is the primary signal

Do **not** guess fix versus improvement from the diff. Resolve in this order:

1. **A type in `$ARGUMENTS`** wins. Use it.
2. **Otherwise parse the leading segment of the branch name** and map its family. The prefix already encodes the author's intent, trust it:

   | branch prefix (case insensitive) | type |
   |---|---|
   | `feature`, `feat` | `feat` |
   | `bugfix`, `fix`, `bug`, `hotfix` | `fix` (note urgency in the body when the branch said `hotfix/`) |
   | `perf`, `performance` | `perf` |
   | `refactor`, `revamp` | `refactor` |
   | `enhance`, `enhancement`, `enhanace` (known typo), `improvement` | `improvement` |
   | `docs`, `doc` | `docs` |
   | `test`, `tests` | `test` |
   | `security`, `sec` | `security` |
   | `chore` | `chore` |
   | `ci` | `ci` |
   | `build` | `build` |
   | `style` | `style` |

3. **On `main` (no prefix), or the prefix is unrecognized**: the branch cannot tell you. Fall back to the engineer's own wording in their request (`fix the broken count` is a `fix`, `make it faster` is an `improvement`). If it is still genuinely ambiguous, **ask**, do not guess between `fix` and `improvement`.

State the chosen type and which signal gave it to you (branch, argument, or wording), then carry on.

**Scope**: a short lower case area name in parentheses, from the changed paths or the domain. This project's usual ones: `tournament`, `fixtures`, `standings`, `admin`, `auth`, `formats`, `api`, `ui`, `db`, `docker`, `skills`. Pick the single most representative one. Leave the scope off rather than inventing a vague one.

### 3. Branch first if on the default branch

The default branch here is **`main`**. If you are on it:

- Create and switch to a topic branch **before** committing:

```bash
git checkout -b <type>/<short-slug>
```

- `<short-slug>` is two to four kebab case words summarizing the change (`improvement/dashboard-statistics`, `fix/standings-tiebreak`).
- Never commit directly to `main`.

Uncommitted work follows a plain `checkout -b` across, no stash needed.

Already on a non default branch: commit there, do not create another.

### 4. Compose the message

Exact format, note the blank line after the subject and the `-` bullets:

```
<type>(<scope>): <imperative summary>

- <imperative phrase describing one change>
- <imperative phrase describing another change>
```

Rules:

- Subject: lower case, imperative mood, no trailing full stop, about 72 characters at most.
- One blank line between the subject and the bullets.
- Bullets use `-`, imperative phrases, no trailing full stop, one per logical change.
- Omit the body only for a genuinely trivial one line change, otherwise always include bullets.
- Do **not** add a `Co-Authored-By` trailer. Keep messages clean. This overrides the trailer rule in `.claude/skills/git/conventions.md` and any session default.

Examples to match:

```
feat(standings): add goal difference tiebreak to group ranking

- Rank level teams by goal difference, then goals scored
- Fall back to head to head result when both are equal
```

```
improvement(admin): collapse fixture queries for faster loading

- Combine eight fixture queries into two
- Cache results per admin session to avoid repeat hits
```

```
fix(fixtures): keep kick off times stable across render

- Format times on the server so client and server output agree
- Stop the hydration warning on the public fixture list
```

An urgent fix is still `fix`, with the urgency in the body:

```
fix(api): prevent fatal error on missing tournament

- Return 404 instead of throwing when the id does not resolve
- Urgent: unblocks the public site returning 500s
```

A breaking change uses `!` and a footer:

```
feat(api)!: require an api key for the fixtures export endpoint

- Add key validation to the export route

BREAKING CHANGE: unauthenticated export requests now return 401
```

### 5. Stage and commit

Prefer explicit paths over `-A`, so nothing arrives by accident:

```bash
git add <paths>
git commit -m "<subject>" -m "<bullet body>"
```

Two `-m` flags give you the blank line between subject and body on every OS, without a heredoc.

If a pre commit hook rejects the commit, report what the hook actually said and stop. Do not retry with `--no-verify`.

### 6. Push

After a successful commit:

```bash
git push -u origin <current-branch>
```

- **Never** `--force` or `--force-with-lease`.
- If the push fails, report the exact error and stop. The commit is saved locally, which is the thing that matters, and a rejected push usually means the remote moved and wants a human decision.

### 7. Report

```
## /snap · <branch>

<type>(<scope>): <subject>
<n> files · pushed to origin/<branch>

<anything you skipped, stopped on, or left out, and why>
```

Say which signal gave you the type when it was not obvious. Keep it short, they are going back to work.

## Relationship to the other skills

`/snap` is the fast path for everyday work: one command, real history, pushed. The `/git` skill is the deliberate path, and it splits the same work into `commit`, `branch`, and `pr`, confirming before anything leaves the machine. Reach for `/git` when you want to think about it, and `/snap` when you do not. `/git pr` is still what opens the pull request, `/snap` only pushes the branch.

## Portability (any OS, any agent)

Any Agent Skills client on macOS, Linux, or Windows. `git` is the only CLI and the `git` lines run as shown everywhere. Do the inspection and scanning with your agent's own read and search tools rather than shell pipelines, and apply the branching logic yourself. No bundled files, this skill is one page on purpose.
