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
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, issue #196 / PR #203, PR #133 | Keep the issue #11 backend evidence handoff and verify/award follow-through aligned to the published contract vocabulary on `main`. |
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
| Backend issue #11 handoff convergence | issue #196 / PR #203 | This is the surviving backend-owned cleanup that keeps the packet, formatter output, and durable Phase 1 status docs pointed at the canonical `smoke:issue11` evidence path on `main`. |
| Verify/award contract adoption | PR #133 | The checklist still needs to describe only the proof fields, error codes, and reason-code vocabulary that are actually published on `main`. |
| Canonical backend evidence path | issue #11, `docs/RUNTIME_EXECUTION_HANDOFF.md`, `docs/BACKEND_API_EXAMPLE_PACKET.md` | The backend-owned formatter path is already merged on `main`; the remaining work is keeping the packet and issue-ready command aligned while QA reuses that path. |
| QA packet and smoke evidence | PR #172 and issue #11 | The remaining QA work is to reuse the canonical formatter output, run the bounded smoke pass, and post the exact result on issue #11. |

### Remaining blocked slices

- Issue #11 remains the only live end-to-end evidence gate; closed issue #120 is historical context, not active work.
- Issue #196 / PR #203 is the backend-owned survivor that removes stale issue #11 handoff references from durable docs; it should merge before more packet or beta-readiness follow-ups stack on top.
- PR #133 remains blocked on contract-vocabulary drift until its checklist matches the published OpenAPI and TypeScript contracts.

## Next 24h Merge Sequence

| Order | Thread | Why now | Expected result |
| --- | --- | --- | --- |
| 1 | PR #203 `[Week 2026-03-19] Converge issue #11 backend evidence path on main` | It is the clean backend-owned survivor for removing stale packet/formatter references before more issue #11 follow-up comments accumulate. | Durable backend docs and issue-ready formatter output all point at the same canonical `smoke:issue11` command on `main`. |
| 2 | PR #133 | Verify/award contract wording still needs to match the merged proof fields, error codes, and reason-code vocabulary. | Contract-facing beta-readiness notes stop drifting from the published OpenAPI/TypeScript baseline. |
| 3 | PR #172 and issue #11 | QA still needs the bounded happy/negative-path smoke evidence posted back onto the final gate issue. | One paste-ready smoke evidence bundle closes the executable QA loop on top of the merged backend handoff. |
| 4 | `owner:albatross` + `stream/review-burndown` planning sweep | Planning hygiene should stay in GitHub queries instead of reintroducing overlapping status snapshots into repo docs. | Checkpoint/roadmap comments keep a live blocker trail without reopening backend-owned stale references. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Backend issue #11 handoff convergence | The immediate M1 gate is landing issue #196 / PR #203 so durable backend docs stop splitting the canonical evidence path across superseded follow-up threads. |
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
