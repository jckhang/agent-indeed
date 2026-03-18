# Phase 1 Acceptance Trace

Last updated: 2026-03-18

This document is the durable acceptance-to-evidence map for epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`).
Use it to decide whether a milestone, issue, or PR comment is actually moving Phase 1 toward a shippable closed-beta baseline.

Keep volatile queue state in GitHub. This file should only answer three stable questions:
- which epic acceptance area is being advanced
- which issue or milestone owns the next executable step
- which evidence must exist before the acceptance area can be treated as satisfied

## Acceptance map

| Epic acceptance area | Stable source of truth | Delivery threads | Required evidence before we call it done | Review notes |
| --- | --- | --- | --- | --- |
| OpenSpec artifacts, OpenAPI draft, and implementation stay aligned | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts` | merged runtime baseline from issues #109/#110/#111, plus issue #11 and issue #120 for follow-through evidence | `openspec validate --all` passes on the merge-ready branch; any runtime/API diff that changes contract scope updates OpenSpec and both API drafts in the same change | Treat this as a release-wide invariant, not a one-time milestone gate |
| Happy-path dispatch flow is runnable end to end | `docs/PHASE1_GOALS.md`, `docs/RUNTIME_EXECUTION_HANDOFF.md`, runtime milestone queries in `docs/PHASE1_CHECKPOINT_BOARD.md` | merged runtime baseline from issues #109/#110, with issue #11 owning the current evidence chain | A local command path exercises `publish -> match -> commit -> reveal -> verify -> award` and records the evidence bundle expected by `docs/RUNTIME_EXECUTION_HANDOFF.md` | Do not accept doc-only claims for this area |
| Core negative scenarios are covered by executable checks | `docs/RUNTIME_EXECUTION_HANDOFF.md`, `docs/PHASE1_BETA_READINESS_GATES.md`, QA milestone queries in `docs/PHASE1_CHECKPOINT_BOARD.md` | issue #120 and issue #11 on top of the merged issue #111 baseline | Automated checks cover the blocked reveal, signature failure, and insufficient-proof paths; rerun evidence is linked back into issue #11 | If the check is manual-only, the acceptance area is still open |
| Audit trail covers key state transitions | `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md`, `docs/PHASE1_BETA_READINESS_GATES.md` | merged runtime baseline from issues #110/#111, with issue #11 and issue #120 carrying the live evidence follow-through | Runtime evidence shows audit output for task creation, bid commit, bid reveal, proof verification, and award; the emitted fields remain traceable to the published contracts | Audit docs without runtime evidence are preparatory, not sufficient |

## Milestone handoff rules

### M1: runnable baseline

Use M1 review to answer:
- is the backend skeleton from issue #109 runnable on a clean branch from `main`
- are contract changes still passing `openspec validate --all`
- does the runtime handoff packet name one local command path that later milestones can reuse

### M2: dispatch loop execution

Use M2 review to answer:
- does issue #110 exercise the full happy-path loop instead of only documenting it
- do merged runtime-facing docs still stay inside the published API baseline
- is the evidence output concrete enough for QA to replay without inventing missing steps

### M3: verify, audit, and smoke durability

Use M3 review to answer:
- do issue #120 and issue #11 keep the merged smoke matrix runnable against current `main`
- do verify and audit outputs show up in the same evidence packet as the happy-path run
- is issue #11 receiving the replayable command output needed for final sign-off

### M4: beta readiness closure

Use M4 review to answer:
- does issue #11 contain the final evidence chain for happy path plus key negatives
- are the audit, telemetry, and security readiness documents still aligned to the executable baseline
- is there any remaining acceptance area whose proof still depends on a docs-only claim

## Review routine

1. Start from the milestone links in `docs/PHASE1_CHECKPOINT_BOARD.md`.
2. Check `docs/RUNTIME_EXECUTION_HANDOFF.md` for the command contract and evidence bundle shape.
3. Confirm the branch or PR under review updates OpenSpec and the API drafts whenever scope changes.
4. Post weekly epic #2 checkpoints with `docs/PHASE1_EPIC_CHECKPOINT_TEMPLATE.md` so each update uses the same Done, Blocked, Ready next, and Validation evidence gaps structure.
5. If evidence is missing, keep the acceptance area open and push the gap back into the relevant GitHub issue or PR instead of copying transient status into repo docs.
