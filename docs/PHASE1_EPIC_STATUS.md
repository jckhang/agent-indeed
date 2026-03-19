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
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md`, PR #190, PR #166, PR #174, and PR #133 | Merge the surviving planning-sync baseline on PR #190, keep the smaller planning follow-ons aligned to that same baseline, and close the remaining verify/award vocabulary drift on PR #133. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, `docs/RUNTIME_EXECUTION_HANDOFF.md`, issue #11, PR #191, PR #182, and PR #172 | Land the backend-owned evidence path, CI smoke contract coverage, and QA packet snippets, then paste the final bounded smoke evidence back onto issue #11. |
| Core negative scenarios are covered | Blocked | issue #11, PR #172, PR #182, `docs/CLOSED_BETA_SECURITY_READINESS.md`, and `docs/ERROR_CODE_RETRY_POLICY.md` | Turn the documented failure cases into reproducible smoke evidence tied to the merged runtime baseline and keep the negative-path proof in the same issue #11 handoff thread. |
| Audit events cover key state transitions | In progress | merged runtime baseline from issues #109/#110, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md`, issue #11, and PR #191 | Keep the verify/award/audit follow-through aligned while the refreshed issue #11 evidence path proves emitted task, proof, and award traces. |

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
- Canonical smoke-comment formatter guidance is merged in PR #175.

### Active follow-through slices

| Epic step | Active issue / PR | Why it still matters to epic #2 |
| --- | --- | --- |
| Planning-stack consolidation | issue #2 / PR #190 | This is the current surviving planning-sync thread for the M1 checkpoint sweep and should replace overlapping checkpoint-rollup rewrites instead of creating another competing snapshot. |
| Planning follow-on cleanup | PR #166 and PR #174 | These smaller planning docs still need to stay consistent with the same post-runtime baseline while PR #190 decides the durable checkpoint rule. |
| Verify/award contract adoption | PR #133 | The checklist still needs to describe only the proof fields, error codes, and reason-code vocabulary that are actually published on `main`. |
| Frontend runtime consumer cleanup | PR #170 and PR #189 | Frontend consumers still need to keep shortlist and runtime-refresh guidance tied to the current published read surfaces. |
| Issue #11 backend and QA evidence handoff | issue #11, PR #191, PR #182, and PR #172 | The remaining happy/negative-path work is now concentrated on one executable evidence lane that can be replayed and reviewed without reopening closed planning or QA umbrella issues. |

### Remaining blocked slices

- Issue #11 remains the only live end-to-end evidence gate for epic #2.
- PR #190 still needs review/merge before the planning lane can stop carrying overlapping checkpoint-sync wording.
- PR #133 remains blocked on contract-vocabulary drift until its checklist matches the published OpenAPI and TypeScript contracts.
- The frontend runtime-consumer follow-ons (PR #170 and PR #189) must stay constrained to merged runtime behavior so issue #11 evidence does not drift from the actual UI/read-model baseline.

## Next 24h Merge Sequence

| Order | Thread | Why now | Expected result |
| --- | --- | --- | --- |
| 1 | PR #190 `docs: collapse planning sweep stack before M1` | It is the designated surviving planning-sync PR for the current checkpoint sweep and reduces duplicate review churn across the planning lane. | One durable planning baseline remains open for epic #2 instead of multiple overlapping roadmap/checkpoint rollups. |
| 2 | PR #191 `[P1-187] Flatten issue #11 backend evidence path` | Backend-owned smoke/evidence formatting is the fastest way to make the remaining QA handoff deterministic. | Issue #11 gets one canonical backend evidence path to reuse in comments and smoke reruns. |
| 3 | PR #182 `[P1-09] Cover dispatch smoke CLI contract in CI` | CI coverage lowers the risk that the issue #11 smoke contract drifts while follow-on docs and QA packets land. | The smoke CLI contract becomes continuously checked instead of comment-only guidance. |
| 4 | PR #172 `[P1-11] Add QA packet snippets for issue #11` | QA still needs reusable packet snippets once the backend-owned evidence format is stable. | The issue #11 handoff thread can carry exact happy/negative-path snippets without ad hoc PR comment copying. |
| 5 | PR #133 plus issue #11 final rerun | Contract wording and final smoke evidence remain after the planning/evidence path is stable. | Verify/award wording and executable evidence both converge on the merged runtime baseline. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Planning-stack cleanup + stable evidence path | The immediate M1 gate is merging PR #190 while keeping PR #166, PR #174, PR #191, PR #182, and PR #172 aligned to the same post-runtime baseline. |
| M2 | Runnable publish/match/bid foundation | The merged dispatch slice stays intact; the live follow-through is keeping frontend consumers (PR #170 / PR #189) and verify/award wording (PR #133) within that published contract surface. |
| M3 | Verify, audit, and executable QA | Issue #11 plus PR #191 / PR #182 / PR #172 now carry the remaining happy-path, negative-path, and audit-evidence burden for the merged runtime. |
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
