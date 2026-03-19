# Phase 1 Epic Status

Last updated: 2026-03-20

This document is the execution snapshot for epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`).
It complements `docs/PHASE1_GOALS.md` by mapping epic acceptance criteria to the current post-runtime issues and PR gates.

## Epic Objective

Deliver a closed-beta MVP for the agent dispatch loop:
`publish -> match -> commit -> reveal -> verify -> award`

## Acceptance Snapshot

| Epic acceptance area | Current status | Source of truth | Next gate |
| --- | --- | --- | --- |
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, PR #174, PR #199, PR #133, merged PR #176, merged PR #179, merged PR #194 | Keep the surviving planning docs aligned with the published contract vocabulary and the current issue #11 evidence lane. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, `docs/RUNTIME_EXECUTION_HANDOFF.md`, issue #11, PR #191, PR #209, merged PR #172 | Land the remaining backend/evidence follow-through PRs, then paste one signed `smoke:issue11` run from `main` onto issue #11. |
| Core negative scenarios are covered | Blocked | issue #11, PR #209, merged PR #172, `docs/CLOSED_BETA_SECURITY_READINESS.md`, `docs/ERROR_CODE_RETRY_POLICY.md` | Re-run the canonical issue #11 smoke path from `main` so the documented failure cases are attached to the live runtime baseline instead of scattered PR comments. |
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
| Post-runtime planning refresh | PR #174, PR #199, merged PR #176, merged PR #179, merged PR #194 | These threads remove stale references to closed runtime/QA issues and establish one consistent planning baseline for the remaining Phase 1 queue. |
| Overlapping planning rollups | PR #174, PR #199 | These are the remaining open planning snapshots that still need to converge on the same live issue #11 evidence lane and blocker list. |
| Verify/award contract adoption | PR #133 | The checklist still needs to describe only the proof fields, error codes, and reason-code vocabulary that are actually published on `main`. |
| Backend handoff convergence | PR #191 | Backend still needs one surviving mainline handoff path so the runnable smoke evidence stays anchored to the current runtime contract. |
| QA packet and smoke evidence | PR #209, merged PR #172, issue #11 | The remaining QA work is to reuse the merged packet baseline, land reusable artifact exports, and post the exact signed result on issue #11. |

### Remaining blocked slices

- Issue #11 remains the only live end-to-end evidence gate; closed issue #120 is historical context, not active work.
- The planning lane still has overlapping open PRs that touch the same roadmap/checkpoint docs, so one surviving rollup must land before the queue can stop restating stale blocker snapshots.
- PR #133 remains blocked on contract-vocabulary drift until its checklist matches the published OpenAPI and TypeScript contracts.

## Next 24h Merge Sequence

| Order | Thread | Why now | Expected result |
| --- | --- | --- | --- |
| 1 | PR #174 `docs: refresh runtime handoff baseline` | Smallest remaining planning fix touching the canonical runtime evidence contract. | Runtime handoff docs stay aligned with the live issue #11 lane. |
| 2 | PR #199 `[P1-09] Refresh planning anchors to issue #11 evidence lane` | Keeps the Phase 1 planning snapshots consistent with merged PR #194 and the live QA queue. | `docs/ROADMAP.md`, `docs/PHASE1_GOALS.md`, `docs/PHASE1_EPIC_STATUS.md`, and checkpoint guidance stop pointing at closed formatter issues. |
| 3 | PR #133 `[P1-131] Add verify-award adoption checklist` | Remaining contract checklist still needs to match the published OpenAPI/TypeScript vocabulary. | Contract wording risk shrinks before final beta gating. |
| 4 | PR #191 `[P1-43] Converge issue #11 backend handoff on one mainline path` | Backend handoff still has to settle on one surviving evidence path on `main`. | Runtime happy-path proof is easier to rerun and cite. |
| 5 | PR #209 `[P1-09] Export issue #11 evidence artifacts`, issue #11 | QA still needs reusable exported artifacts plus one signed rerun from `main`. | One canonical smoke evidence path feeds the final QA sign-off thread. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Post-runtime planning/reference cleanup | The immediate M1 gate is landing PR #174 and PR #199 so the surviving planning docs all point at the same live issue #11 evidence lane. |
| M2 | Runtime evidence formatting and reuse | Merged PR #172 gives QA one reusable packet baseline; PR #191 and PR #209 still need to finish the surviving handoff/export path on top of `main`. |
| M3 | Verify, audit, and executable QA | Issue #11 remains the live proof point once the open backend/evidence follow-through PRs land and QA can paste a signed rerun from `main`. |
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
