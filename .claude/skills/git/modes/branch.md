# /git branch

Start a correctly named branch for the work, cut from a fresh base. Acts, no permission needed, a local branch costs nothing and is trivially undone.

## 1. Read the state

```bash
git rev-parse --abbrev-ref HEAD
git status --short
git branch --list
git log --oneline -10
```

Work out three things: which branch you are on, whether there is uncommitted work, and what the base branch is. For the base, prefer `main` if it exists, else `master`:

```bash
git rev-parse --verify main
```

## 2. Name the branch

Follow the rules in `conventions.md`, `<prefix>/<slug>`, and look at `git branch --list` for what this repo actually does.

Get the name from the work itself, in this order:

1. What the engineer said when they ran the skill (`/git branch fix for the double charge` → `fix/double-charge`).
2. The current scope feature name, if `docs/scope/` has one in progress. Read it and use the feature name kebab cased.
3. The uncommitted diff. Read it and name what it does.

Pick the prefix from the change type, the same type you would put on the commit. A fix gets `fix/`, new behavior gets `feat/`.

If none of those give you a real name, ask. A branch called `feat/updates` helps nobody, and the engineer can name it in three words.

Check the name is free before you use it. If it exists, do not silently switch to it, say it exists and ask whether to reuse it or pick another.

## 3. Cut it from a fresh base

Being a few days behind base is the ordinary cause of a painful merge later. So refresh the base first, but only in ways that cannot lose work.

**Clean tree, on the base branch:**

```bash
git fetch origin
git checkout -b <name> origin/<base>
```

Branching from `origin/<base>` rather than local `<base>` gets you today's code without needing to fast forward your local base branch.

No remote, or `fetch` fails (offline, no network): branch from local base instead, and say in one line that the base may be stale.

**Uncommitted work you want to carry over**, the common case when you started coding on main before making a branch:

```bash
git checkout -b <name>
```

That is all. A plain checkout to a new branch carries uncommitted changes with it, no stash needed. Do not fetch and rebase underneath uncommitted work. Say in one line that the branch came off the current local base, and that they can refresh it later once the work is committed.

**Already on a feature branch** with the work on it: do not make a second branch. Say which branch they are on and stop, unless they explicitly asked for a new one off this one.

## 4. Confirm

```bash
git rev-parse --abbrev-ref HEAD
git status --short
```

Check the uncommitted files that were there before are still there. If anything is missing, stop and say so loudly rather than continuing.

## 5. Report

```
## /git branch · <name>

Cut from <origin/main, fresh | local main, may be behind>.
<Carried n uncommitted files across.>   (only when there were some)
Next: /git commit once the work is ready.
```

Do not push the branch. A branch with no commits has nothing to push, and the first push is `pr` mode's job, with a confirmation.
