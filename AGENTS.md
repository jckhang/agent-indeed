# AGENTS.md

## Repo workflow
- Treat this repo as OpenSpec-first: update `openspec/changes/agent-dispatch-platform/` artifacts before or alongside implementation changes.
- Keep the API draft in sync across `src/api/openapi.yaml`, `src/api/contracts.ts`, and the related OpenSpec specs.
- When changing scope or acceptance criteria, also review `docs/PHASE1_GOALS.md`, `docs/ROADMAP.md`, and `docs/issues/PHASE1_ISSUES.md`.

## Known commands
- Validate OpenSpec changes with `openspec validate`.

## Repo layout
- `openspec/changes/agent-dispatch-platform/`: proposal, design, tasks, and capability specs for the MVP.
- `src/api/openapi.yaml`: REST API draft for onboarding, task marketplace, bidding, and PoMW verification.
- `src/api/contracts.ts`: TypeScript contract draft for `AgentBundle`, `TaskSpec`, `Bid`, and `ProofPack`.
- `docs/`: roadmap, phase goals, and issue breakdown that track the current MVP plan.

## TODO
- No repo-local build, lint, or test command is defined yet; add verified commands here once they exist in the workspace.
