---
name: task-complete
description: Run final verification (lint, typecheck, build, code review) on the current changes and commit when everything passes. Use when the user invokes /task-complete, says "I'm done", "wrap up", "finish this task", "the task is done — commit it", "ready to commit", "review and commit", or otherwise signals their work is ready to be verified and committed. Trigger even on casual phrasing — this skill is the standard handoff between "I think it's done" and a clean commit.
---

# Task Complete

Verifies an in-progress task is correct, surfaces issues to the user, and commits the changes — only when the user approves.

## When this skill applies

The user has done some work and is ready to ship it. They want a final pass before the commit lands: see what changed, confirm the code builds and lints, hear an independent reviewer's take, then commit. This skill ties those steps together so the user doesn't have to remember each one.

The skill always **shows findings and asks** — it never silently auto-fixes, and it never commits without an explicit approval.

## Workflow

Follow these steps in order. Stop and consult the user whenever a step surfaces a problem.

### 1. Confirm there's something to commit

Run `git rev-parse --is-inside-work-tree`. If it errors, tell the user this directory is not a git repository yet and offer to run `git init` before continuing. Don't assume — wait for them to confirm.

Then run `git status` and `git diff` (both `git diff` and `git diff --staged`) so the full set of changes is visible. If both diffs are empty and nothing is untracked, tell the user there's nothing to commit and stop — there's no work to verify.

### 2. Detect which workspaces changed

This repo is a monorepo with workspaces at `frontend/` (Next.js) and `backend/` (NestJS). Inspect the changed file paths from step 1:

- Files under `frontend/` → run frontend checks
- Files under `backend/` → run backend checks
- Both → run both workspaces in parallel
- Neither (only root-level files like `docker-compose.yml`, `docs/`) → skip workspace checks; go straight to step 4

Don't run checks for a workspace that wasn't touched — it wastes time and adds noise.

### 3. Run static checks

For each touched workspace, run lint + typecheck + build. Run independent commands in parallel where you can (different workspaces; within a workspace, lint and typecheck can run before the build).

**frontend/** (Next.js):
- Lint: `cd frontend && npm run lint`
- Typecheck: `cd frontend && npx tsc --noEmit`
- Build: `cd frontend && npm run build`

**backend/** (NestJS):
- Lint: `cd backend && npm run lint`
- Build: `cd backend && npm run build` (this also typechecks via `nest build`)

If any check fails, stop. Show the user the failure output (trim to the relevant lines — full stack traces only when actually useful) and ask how to proceed via `AskUserQuestion`:

- **Fix now** — they'll address it (possibly with your help) and re-run /task-complete
- **Commit anyway** — they accept the risk (rare; worth confirming twice for build failures)
- **Abort** — drop the commit, leave things as-is

Do NOT auto-fix without asking. The "fix" may not match their intent, and a failure can be a symptom of something larger.

### 4. Run the code reviewer

Invoke the `code-review` skill via the Skill tool with no arguments. That skill reads the current diff and reports correctness bugs.

Wait for it to finish before moving on. Collect its findings verbatim — don't re-summarize away nuance.

### 5. Present results and ask

Give the user a single, scannable summary:

- **Diff stats**: files changed, lines +/−
- **Static checks**: PASS / FAIL per workspace (with the key error line on failure)
- **Code review**: each finding with file:line, severity, and the reviewer's reasoning

If everything is clean (no failures, no review findings), say so plainly and propose a commit message based on the diff. Then ask for approval to commit.

If there are findings, use `AskUserQuestion` with options:

- **Fix the issues** — stop here so the user (or you) can address them; they'll re-run /task-complete after
- **Commit as-is** — they've read the findings and choose to ship anyway
- **Abort** — no commit; let them think it over

Never decide for them. These are judgment calls — the reviewer might be wrong, the issue might be intentional, or the user might want to ship now and follow up.

### 6. Commit (only on explicit approval)

When — and only when — the user approves:

1. **Stage deliberately.** Prefer `git add <specific files>` over `git add -A` / `git add .`. Sweeping adds can pull in `.env*`, build artifacts, editor scratch files, or unrelated experiments. If untracked files exist that look intentional (new source files), name them in the question and let the user confirm before staging.

2. **Draft the commit message.** Look at `git log --oneline -20` to match the repo's style (conventional commits? sentence case? scope prefixes?). Lead with *why*, not *what* — the diff already shows what. Keep the subject under ~70 chars; add a body only when the change isn't self-evident.

3. **Commit using a heredoc** to preserve formatting:

   ```bash
   git commit -m "$(cat <<'EOF'
   <subject>

   <optional body>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```

4. **Verify it landed.** Run `git status` and `git log -1 --stat` to confirm the commit was created and the working tree matches expectations.

### 7. Stop at the commit

Do not `git push`. Do not open a PR. Those are separate, user-initiated actions — confirm them explicitly each time, even if the user has approved a push earlier in the session.

## Edge cases

- **Pre-commit hook fails**: The commit did NOT happen. Fix the underlying issue, re-stage, and create a NEW commit. Never use `--no-verify`, and never `--amend` after a hook failure (amending would modify the *previous* commit, which is not what you want).
- **Reviewer hangs or errors**: Tell the user what happened. Offer to skip the review step and continue (with their explicit acknowledgment) or abort.
- **Mixed-workspace change with one side failing**: Show both results. Don't commit the passing side alone unless the user explicitly asks for a partial commit — the two halves may depend on each other.
- **Untracked files that look unrelated** (`.env.local`, `*.log`, IDE scratch, `node_modules/` debris): Default to leaving them out. Mention them so the user knows they're untracked, but don't stage without permission.
- **Repo not initialized**: Offer `git init` once. Don't initialize automatically — the user may be in the wrong directory.

## What NOT to do

- Don't run the dev server, tests, or e2e suites unless the user asked. This skill's scope is lint / typecheck / build / review / commit.
- Don't squash, rebase, or amend prior commits.
- Don't push to a remote.
- Don't auto-fix lint warnings or code-review findings. Surface them; let the user choose.
- Don't commit `.env`, credentials, large binaries, or `node_modules/`.
- Don't bypass hooks (`--no-verify`) or skip signing.
- Don't generate documentation files or release notes as a side effect.
