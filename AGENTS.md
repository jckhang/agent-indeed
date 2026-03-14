# AGENTS.md

## Repo workflow

- Treat this repo as OpenSpec-first: update `openspec/changes/agent-dispatch-platform/` artifacts before or alongside implementation changes.
- Keep the API draft in sync across `src/api/openapi.yaml`, `src/api/contracts.ts`, and the related OpenSpec specs.
- When changing scope or acceptance criteria, also review `docs/PHASE1_GOALS.md`, `docs/ROADMAP.md`, and `docs/issues/PHASE1_ISSUES.md`.
- One issue/scope should map to exactly one focused PR; do not mix unrelated changes.
- Never develop or commit directly on `main`; `main` is only the sync baseline.
- For every new task, start from updated `main`, then immediately create a fresh branch before editing files.
- Before writing code for each task, run:
  1. `git switch main`
  2. `git fetch origin`
  3. `git pull --ff-only origin main`
  4. `git switch -c codex/<issue-or-scope>` (or `git checkout -b codex/<issue-or-scope>`)
- Before every push/PR update, run:
  1. `git fetch origin`
  2. `git rebase origin/main`
  3. Resolve conflicts if any, then `git add <files>` and `git rebase --continue`
  4. Re-run required validation commands
  5. Push branch (`git push --force-with-lease` when history was rewritten by rebase)

## PR and issue format policy

- All PRs must use `.github/pull_request_template.md`.
- Every PR must include:
  - Exactly one department label: `dept/frontend`, `dept/backend`, `dept/qa`, or `dept/planning`
  - Exactly one type label: `type/feature`, `type/bugfix`, `type/refactor`, `type/docs`, `type/test`, `type/chore`, or `type/spec`
- Every issue should use the same enum set for ownership and work classification.
- Source of truth for enums and examples: `docs/WORK_ITEM_TAXONOMY.md`.
- PR descriptions must be self-complete for review:
  - acceptance criteria mapping
  - reproducible QA steps and expected results
  - validation output and risk/rollback note

## Known commands

- Validate OpenSpec changes for active work with `openspec validate --changes`.
- Run full OpenSpec validation with `openspec validate --all` when needed.
- Sync required issue/PR labels with `bash scripts/bootstrap_work_item_labels.sh`.

## Repo layout

- `openspec/changes/agent-dispatch-platform/`: proposal, design, tasks, and capability specs for the MVP.
- `src/api/openapi.yaml`: REST API draft for onboarding, task marketplace, bidding, and PoMW verification.
- `src/api/contracts.ts`: TypeScript contract draft for `AgentBundle`, `TaskSpec`, `Bid`, and `ProofPack`.
- `docs/`: roadmap, phase goals, and issue breakdown that track the current MVP plan.

## Agent collaboration rules

- Every developer agent must have a stable unique name and reuse it across branch/workspace/notes.
- Every developer agent must use `workspace-<agent-name>/` with:
  - `agents.md`
  - `memory/`
- Do not edit or delete files in other agents' workspaces unless explicitly asked.
- Before first commit on a branch, bootstrap agent identity in this worktree:
  - `bash scripts/agent_identity_bootstrap.sh --agent-name <agent-name> --github-user <agent-github-user>`
- The bootstrap script writes `git config --worktree user.name/user.email`, so identities stay isolated across worktrees.
- Before every push, run the guard check:
  - `bash scripts/agent_prepush_check.sh --github-user <agent-github-user>`
- If identity is wrong, amend before opening/updating PR:
  - `git commit --amend --no-edit --reset-author`
- For all PR comments/review replies, append an explicit signature line at the end:
  - `--<agent-name>`

## TODO

- No repo-local build, lint, or test command is defined yet; add verified commands here once they exist in the workspace.
