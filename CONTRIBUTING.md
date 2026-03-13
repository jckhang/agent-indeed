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

1. Create a branch using `codex/<topic>` prefix.
2. Update OpenSpec artifacts first (or in the same PR as implementation).
3. Update API contracts and docs in the same change set.
4. Run validation:
   - `openspec validate --all`
5. Open a PR with linked issue(s), scope notes, and verification output.

## Commit and Change Scope

- Keep commits focused to one logical change.
- Avoid mixing unrelated docs/spec/API changes in one PR.
- Prefer small, reviewable diffs with explicit acceptance criteria.

## Pull Request Checklist

Before requesting review, ensure:

- [ ] OpenSpec artifacts are updated for behavior/scope changes.
- [ ] `openapi.yaml` and `contracts.ts` remain aligned.
- [ ] Roadmap/goals/issues docs are updated when planning scope changes.
- [ ] `openspec validate --all` passes locally.
- [ ] Related issue links are added in the PR description.

## Current Tooling Notes

- No repo-local build/lint/test command is defined yet.
- Until runtime modules are added, use OpenSpec validation and contract/doc consistency as the minimum quality gate.
