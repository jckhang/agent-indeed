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
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, issue #167, PR #174, PR #176, PR #179, PR #133 | Merge the post-runtime planning/reference cleanup, then keep PR #133 aligned to the published contract vocabulary. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, `docs/RUNTIME_EXECUTION_HANDOFF.md`, `docs/BACKEND_API_EXAMPLE_PACKET.md`, PR #172, and issue #11 | Reuse the canonical smoke evidence path from `main`, run the bounded smoke pass, and paste the final evidence back onto issue #11. |
| Core negative scenarios are covered | Blocked | issue #11, PR #172, `docs/CLOSED_BETA_SECURITY_READINESS.md`, `docs/ERROR_CODE_RETRY_POLICY.md` | Turn the documented failure cases into reproducible smoke evidence tied to the merged runtime baseline. |
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
| Post-runtime planning refresh | issue #167, PR #174, PR #176, PR #179 | These threads remove stale references to closed runtime/QA issues and establish one consistent planning baseline for the remaining Phase 1 queue. |
| Overlapping planning rollups | PR #171, PR #154, PR #165, PR #166, PR #161, PR #153 | These older planning refresh branches should either be folded into PR #179 or closed as superseded so the repo stops carrying conflicting queue snapshots. |
| Verify/award contract adoption | PR #133 | The checklist still needs to describe only the proof fields, error codes, and reason-code vocabulary that are actually published on `main`. |
| Canonical backend evidence path | issue #11, `docs/RUNTIME_EXECUTION_HANDOFF.md`, `docs/BACKEND_API_EXAMPLE_PACKET.md` | The backend-owned formatter path is already merged on `main`; the remaining work is keeping the packet and issue-ready command aligned while QA reuses that path. |
| QA packet and smoke evidence | PR #172 and issue #11 | The remaining QA work is to reuse the canonical formatter output, run the bounded smoke pass, and post the exact result on issue #11. |

### Remaining blocked slices

- Issue #11 remains the only live end-to-end evidence gate; closed issue #120 is historical context, not active work.
- The planning lane still has overlapping open PRs that touch the same roadmap/checkpoint docs, so one surviving rollup must land before the queue can stop restating stale blocker snapshots.
- PR #133 remains blocked on contract-vocabulary drift until its checklist matches the published OpenAPI and TypeScript contracts.

## Next 24h Merge Sequence

| Order | Thread | Why now | Expected result |
| --- | --- | --- | --- |
| 1 | PR #174 `docs: refresh runtime handoff baseline` | Smallest live planning fix with direct stale-reference feedback. | Runtime handoff docs stop treating closed issue #120 as active. |
| 2 | PR #176 `docs: codify planning reference rules` | Makes the contributor/reference rules match the post-runtime review workflow. | Future planning PRs point at live queries and same-day sweep threads instead of closed issues. |
| 3 | PR #179 `[P1-167] Refresh planning docs to post-runtime baseline` | Preferred surviving rollup for issue #167 after the two smaller doc fixes land. | `docs/ROADMAP.md`, `docs/PHASE1_GOALS.md`, `docs/PHASE1_CHECKPOINT_BOARD.md`, and this file all describe the same post-runtime queue. |
| 4 | PRs #171, #154, #165, #166, #161, #153 | Overlapping planning branches should no longer stay open as competing snapshots. | Close, fold, or restack them behind the merged #167 rollup. |
| 5 | PR #133, PR #172, and issue #11 | Contract wording, QA packet reuse, and final smoke evidence remain after planning drift is removed. | One canonical smoke evidence path on `main` feeds the final QA sign-off thread. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Post-runtime planning/reference cleanup | The immediate M1 gate is landing the #167 planning refresh plus PR #174 and PR #176 without leaving older duplicate status threads behind. |
| M2 | Runtime evidence formatting and reuse | The canonical backend evidence path is already on `main`; keep `docs/BACKEND_API_EXAMPLE_PACKET.md` and `npm run --silent smoke:issue11` aligned so QA can reuse it cleanly. |
| M3 | Verify, audit, and executable QA | PR #172 and issue #11 are the remaining proof points for runnable smoke evidence on top of the merged runtime baseline. |
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
