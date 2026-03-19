# Phase 1 Epic Status

Last updated: 2026-03-19

This document is the execution snapshot for epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`).
It complements `docs/PHASE1_GOALS.md` by mapping epic acceptance criteria to the current post-runtime issues and PR gates.

## Epic Objective

Deliver a closed-beta MVP for the agent dispatch loop:
`publish -> match -> commit -> reveal -> verify -> award`

## Acceptance Snapshot

| Epic acceptance area | Current status | Source of truth | Next gate |
| --- | --- | --- | --- |
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, the live planning review-burndown queue, PR #174, PR #192, PR #195, PR #133 | Keep the live planning/beta-readiness cleanup aligned with the published contract vocabulary, then keep PR #133 synced to that baseline. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, `docs/RUNTIME_EXECUTION_HANDOFF.md`, issue #196, and issue #11 | Keep the canonical `main` smoke evidence command documented in one place, rerun it from `main`, and paste the final evidence back onto issue #11. |
| Core negative scenarios are covered | Blocked | issue #11, `docs/RUNTIME_EXECUTION_HANDOFF.md`, `docs/CLOSED_BETA_SECURITY_READINESS.md`, `docs/ERROR_CODE_RETRY_POLICY.md` | Keep the documented failure cases tied to the same canonical `main` smoke evidence packet so QA and planning are not blocked on stale formatter PR references. |
| Audit events cover key state transitions | In progress | merged runtime baseline from issues #109/#110, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md`, issue #11 | Keep the verify/award/audit follow-through aligned while the final smoke evidence proves the emitted trail. |

## Delivery Slice Status

### Completed baseline slices

- #3 AgentBundle contract baseline defined.
- #5 TaskSpec publish contract baseline defined.
- #55 candidate matching shortlist contract merged.
- #72 closed-beta security readiness checklist merged.
- Runtime backend skeleton is merged; issue #109 is closed.
- Runnable dispatch vertical slice is merged; issue #110 is closed.
- Executable QA conversion baseline is merged; issue #111 is closed.
- QA contract-drift guard baseline is merged in PR #159 and retained in `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md`.
- Frontend runtime consumer baseline is merged in PR #152.
- Backend API example packet is merged in PR #164.

### Active follow-through slices

| Epic step | Active issue / PR | Why it still matters to epic #2 |
| --- | --- | --- |
| Post-runtime planning refresh | planning review-burndown queue, PR #174, PR #192, PR #195 | These live planning threads keep roadmap, checkpoint, and beta-readiness docs pointed at the current issue #11 evidence path instead of closed blocker ledgers. |
| Planning queue overlap | PR #166, PR #165 | Remaining planning-sync follow-ons should either align to the current review-burndown baseline or be closed with signed rationale so the repo avoids conflicting queue snapshots. |
| Verify/award contract adoption | PR #133 | The checklist still needs to describe only the proof fields, error codes, and reason-code vocabulary that are actually published on `main`. |
| Backend evidence-path convergence | issue #196 | Backend docs/examples still need to stay anchored on the canonical `main` `smoke:issue11` command, `docs/RUNTIME_EXECUTION_HANDOFF.md`, and the final issue #11 evidence thread. |
| QA packet and smoke evidence | issue #11 | The remaining QA work is to reuse the canonical `main` evidence command and API packet, run the bounded smoke pass, and keep the exact result posted on issue #11. |

### Remaining blocked slices

- Issue #11 remains the only live end-to-end evidence gate; closed issue #120 is historical context, not active work.
- The planning lane still has overlapping open PRs that touch the same roadmap/checkpoint docs, so one surviving rollup must land before the queue can stop restating stale blocker snapshots.
- PR #133 remains blocked on contract-vocabulary drift until its checklist matches the published OpenAPI and TypeScript contracts.

## Next 24h Merge Sequence

| Order | Thread | Why now | Expected result |
| --- | --- | --- | --- |
| 1 | PR #174 `docs: refresh runtime handoff baseline` | Smallest live planning fix with direct stale-reference feedback. | Runtime handoff docs stay aligned to the canonical issue #11 evidence path. |
| 2 | PR #192 `docs: refresh epic issue #11 baseline snapshot` | Refreshes the stable epic snapshot to the current issue #11 evidence lane and surviving follow-through queue. | Epic status and roadmap docs stop pointing at superseded backend/QA anchors. |
| 3 | PR #195 `docs: refresh beta readiness gate dependencies` | Keeps beta-readiness gates aligned to the same issue #11 evidence lane used by runtime handoff docs. | Release-gate docs stop treating closed blockers as active owners. |
| 4 | PRs #166 and #165 | Remaining planning follow-ons should either reuse the current planning sweep baseline or close as superseded. | One live planning queue remains instead of competing snapshot branches. |
| 5 | PR #133, issue #196, issue #11 | Contract wording and final smoke evidence remain after planning drift is removed. | One canonical smoke evidence path on `main` feeds the final QA sign-off thread. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Post-runtime planning/reference cleanup | The immediate M1 gate is landing the live planning and beta-readiness doc cleanup without reintroducing closed blocker references. |
| M2 | Runtime evidence formatting and reuse | Keep planning/runtime references flattened onto the canonical `main` `smoke:issue11` command via issue #196 so QA reuses one evidence path cleanly. |
| M3 | Verify, audit, and executable QA | Issue #11 remains the proof point for runnable smoke evidence on top of the merged runtime baseline. |
| M4 | Beta readiness sign-off | Issue #11 final E2E evidence and audit/security verification remain required. |

## Epic Exit Checklist

- [ ] Upload and publish runtime paths are executable in a local service.
- [ ] Active follow-through branches stay aligned with merged OpenSpec/OpenAPI/contracts.
- [ ] Audit trace outputs are emitted and queryable for beta review.
- [ ] QA smoke matrix and MVP E2E assertions are runnable and passing.
- [x] Security/compliance readiness checklist is merged and linked to QA validation.

## Review Routine

When epic #2 is updated, also review:
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- `docs/PHASE1_CHECKPOINT_BOARD.md`
- `docs/issues/PHASE1_ISSUES.md`
