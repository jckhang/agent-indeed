# Contributing to agent-indeed

Thanks for contributing. This repository is currently API/spec-first, so most changes should start from specification and contract alignment before runtime implementation.

## Ground Rules

- Follow OpenSpec-first workflow for product changes.
- Keep API draft in sync across:
  - `src/api/openapi.yaml`
  - `src/api/contracts.ts`
  - `openspec/changes/agent-dispatch-platform/`
- If scope or acceptance criteria changes, also review:
  - `docs/PHASE1_GOALS.md`
  - `docs/ROADMAP.md`
  - `docs/issues/PHASE1_ISSUES.md`

## Branch and PR Flow

1. Sync from `main` before each new task:
   - `git switch main`
   - `git fetch origin`
   - `git pull --ff-only origin main`
2. Create a new branch using `codex/<topic>` prefix:
   - `git switch -c codex/<topic>` (or `git checkout -b codex/<topic>`)
3. Never develop or commit directly on `main`.
4. Update OpenSpec artifacts first (or in the same PR as implementation).
5. Update API contracts and docs in the same change set.
6. Run validation:
   - `openspec validate --all`
7. Open a PR with linked issue(s), scope notes, and verification output.

## Push Sync Requirement (before every push)

1. `git fetch origin`
2. `git rebase origin/main`
3. If conflicts appear, resolve and continue:
   - `git add <files>`
   - `git rebase --continue`
4. Re-run required validation commands.
5. Push updates (use `git push --force-with-lease` when rebase rewrites history).

## Multi-Agent Identity Isolation

When multiple agents share one machine/worktree pool, isolate identity for commit, push, and PR/comment operations.

1. Bootstrap identity once per worktree:
   - `bash scripts/agent_identity_bootstrap.sh --agent-name <agent-name> --github-user <agent-github-user>`
2. Use the per-agent `gh` wrapper for PR/comment/review actions:
   - `bash scripts/agent_gh.sh <agent-name> auth status`
   - `bash scripts/agent_gh.sh <agent-name> pr create ...`
   - `bash scripts/agent_gh.sh <agent-name> pr comment ...`
3. Run identity/rebase checks before every push:
   - `bash scripts/agent_prepush_check.sh --agent-name <agent-name> --github-user <agent-github-user>`
4. Keep review-thread replies signed with `--<agent-name>`.
5. For strict per-account push separation, use per-agent fork + SSH key (see `docs/AGENT_IDENTITY.md`).

## Commit and Change Scope

- Keep commits focused to one logical change.
- Avoid mixing unrelated docs/spec/API changes in one PR.
- Prefer small, reviewable diffs with explicit acceptance criteria.

## Pull Request Checklist

Before requesting review, ensure:

- [ ] OpenSpec artifacts are updated for behavior/scope changes.
- [ ] `openapi.yaml` and `contracts.ts` remain aligned.
- [ ] Roadmap/goals/issues docs are updated when planning scope changes.
- [ ] Work is on a dedicated `codex/<topic>` branch (not `main`).
- [ ] `openspec validate --all` passes locally.
- [ ] Related issue links are added in the PR description.
- [ ] Review-thread replies are explicit and signed with `--<agent-name>`.

## Current Tooling Notes

- No repo-local build/lint/test command is defined yet.
- Until runtime modules are added, use OpenSpec validation and contract/doc consistency as the minimum quality gate.
