# Phase 1 Acceptance Trace

Last updated: 2026-03-19

This document is the durable acceptance-to-evidence map for epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`).
Use it to decide whether a milestone, issue, or PR comment is actually moving Phase 1 toward a shippable closed-beta baseline.

Keep volatile queue state in GitHub. This file should only answer three stable questions:
- which epic acceptance area is being advanced
- which docs or live issue/query own the next executable step
- which evidence must exist before the acceptance area can be treated as satisfied

## Acceptance map

| Epic acceptance area | Stable source of truth | Live delivery lane | Required evidence before we call it done | Review notes |
| --- | --- | --- | --- | --- |
| OpenSpec artifacts, OpenAPI draft, and implementation stay aligned | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts` | merge-ready runtime and planning PRs plus the issue `#11` evidence lane | `openspec validate --all` passes on the merge-ready branch; any contract-scope diff updates OpenSpec plus both API drafts in the same change; runnable proof links back into issue `#11` when the branch changes execution behavior | Treat this as a release-wide invariant, not a one-time milestone gate |
| Happy-path dispatch flow is runnable end to end | `docs/PHASE1_GOALS.md`, `docs/RUNTIME_EXECUTION_HANDOFF.md`, `docs/BACKEND_API_EXAMPLE_PACKET.md` | issue `#11` using the canonical smoke command and packet baseline published on `main` | One local command path exercises `publish -> match -> commit -> reveal -> verify -> award`, records the evidence bundle expected by `docs/RUNTIME_EXECUTION_HANDOFF.md`, and is replayable without reconstructing payloads from PR comments | Do not accept doc-only claims for this area |
| Core negative scenarios are covered by executable checks | `docs/RUNTIME_EXECUTION_HANDOFF.md`, `docs/PHASE1_BETA_READINESS_GATES.md`, `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md` | issue `#11` plus the current QA/runtime review queue | Automated checks cover blocked reveal, invalid signature, proof `FAIL`, and award-blocked paths; expected results use the published contract vocabulary and the rerun evidence links back into issue `#11` | If the check is manual-only, the acceptance area is still open |
| Audit trail covers key state transitions | `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md`, `docs/PHASE1_BETA_READINESS_GATES.md` | issue `#11` plus the backend-owned smoke evidence path already merged on `main` | Runtime evidence shows audit output for task creation, bid commit, bid reveal, proof verification, and award; the emitted fields stay traceable to the published contracts and packet examples | Audit docs without runtime evidence are preparatory, not sufficient |

## Milestone handoff rules

### M1: post-runtime baseline hygiene

Use M1 review to answer:
- are OpenSpec, OpenAPI, and TypeScript contract updates still merged together whenever scope changes
- do checkpoint and roadmap docs point reviewers at live planning queries plus issue `#11`, instead of closed blocker issues
- does the runtime handoff packet still name one canonical command path that later milestones can reuse

### M2: dispatch loop replayability

Use M2 review to answer:
- does issue `#11` contain one replayable happy-path packet instead of scattered PR-only evidence
- do merged runtime-facing docs stay inside the published API baseline
- is the evidence output concrete enough for QA or beta consumers to rerun without inventing missing steps

### M3: verify, audit, and smoke durability

Use M3 review to answer:
- do the negative-path checks remain runnable against the merged baseline
- do verify and audit outputs show up in the same evidence packet as the happy-path run
- does the dated QA sweep still agree with the published OpenAPI and TypeScript contract vocabulary

### M4: beta readiness closure

Use M4 review to answer:
- does issue `#11` contain the final evidence chain for happy path plus key negatives
- are the audit, telemetry, and security readiness docs still aligned to the executable baseline
- is there any remaining acceptance area whose proof still depends on a docs-only claim

## Review routine

1. Start from the milestone links in `docs/PHASE1_CHECKPOINT_BOARD.md`.
2. Use `docs/PHASE1_ACCEPTANCE_TRACE.md` to map the checkpoint back to the epic acceptance area it is supposed to close.
3. Check `docs/RUNTIME_EXECUTION_HANDOFF.md` for the command contract and evidence bundle shape.
4. Confirm the branch or PR under review updates OpenSpec and the API drafts whenever scope changes.
5. Post weekly epic #2 checkpoints with `docs/PHASE1_EPIC_CHECKPOINT_TEMPLATE.md` so each update uses the same Done, Blocked, Ready next, and Validation evidence gaps structure.
6. If evidence is missing, keep the acceptance area open and push the gap back into the relevant GitHub issue or PR instead of copying transient status into repo docs.
