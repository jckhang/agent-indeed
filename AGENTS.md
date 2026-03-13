# AGENTS.md

## Repo workflow

- Treat this repo as OpenSpec-first: update `openspec/changes/agent-dispatch-platform/` artifacts before or alongside implementation changes.
- Keep the API draft in sync across `src/api/openapi.yaml`, `src/api/contracts.ts`, and the related OpenSpec specs.
- When changing scope or acceptance criteria, also review `docs/PHASE1_GOALS.md`, `docs/ROADMAP.md`, and `docs/issues/PHASE1_ISSUES.md`.
- One issue/scope should map to exactly one focused PR; do not mix unrelated changes.
- Before writing code for each task, run:
  1. `git switch main`
  2. `git fetch origin`
  3. `git pull --ff-only origin main`
  4. `git switch -c codex/<issue-or-scope>`

## Known commands

- Validate OpenSpec changes for active work with `openspec validate --changes`.
- Run full OpenSpec validation with `openspec validate --all` when needed.

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
- Before first commit on a branch, set git identity to the agent identity:
  1. `git config user.name "<agent-name>"`
  2. `git config user.email "<agent-github-noreply-email>"`
- Verify identity before push:
  - `git show -s --format='Author: %an <%ae>%nCommitter: %cn <%ce>' HEAD`
- If identity is wrong, amend before opening/updating PR:
  - `git commit --amend --no-edit --reset-author`
- For all PR comments/review replies, append an explicit signature line at the end:
  - `--<agent-name>`

## TODO

- No repo-local build, lint, or test command is defined yet; add verified commands here once they exist in the workspace.
