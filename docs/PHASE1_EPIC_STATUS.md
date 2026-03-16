# Phase 1 Epic Status

Last updated: 2026-03-16

This document is the execution snapshot for epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`).
It complements `docs/PHASE1_GOALS.md` by mapping epic acceptance criteria to current issue and PR gates.

## Epic Objective

Deliver a closed-beta MVP for the agent dispatch loop:
`publish -> match -> commit -> reveal -> verify -> award`

## Acceptance Snapshot

| Epic acceptance area | Current status | Source of truth | Next gate |
| --- | --- | --- | --- |
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts` | Keep open contract PRs #66, #68, #83, #90, and #92 aligned while runtime code lands. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, issues #11, #109, #110, #111 | Land runnable backend slices (#109, #110) and execute smoke/E2E checks (#111) before unblocking issue #11. |
| Core negative scenarios are covered | Blocked | issues #11 and #111, `docs/CLOSED_BETA_SECURITY_READINESS.md`, `docs/ERROR_CODE_RETRY_POLICY.md` | Convert documented failure scenarios into executable assertions against runtime endpoints. |
| Audit events cover key state transitions | In progress | issue #110, PR #92, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md` | Bind audit contracts to emitted runtime events and include them in QA evidence capture. |

## Delivery Slice Status

### Completed baseline slices

- #3 AgentBundle contract baseline defined.
- #5 TaskSpec publish contract baseline defined.
- #55 candidate matching shortlist contract merged.
- #72 closed-beta security readiness checklist merged.
- Frontend baseline slices for manager/agent/operator surfaces are merged (#53, #56, #67, #70, #73, #74, #76, #78).

### Active implementation slices

| Epic step | Active issue / PR | Why it still matters to epic #2 |
| --- | --- | --- |
| Runtime backend skeleton | issue #109 | Provides the first runnable control-plane service and persistence baseline. |
| Runnable dispatch vertical slice | issue #110 | Converts contract-only flow into executable state transitions across publish/match/bid/verify/award. |
| Contract convergence | PRs #66, #68, #83, #90, #92 | Prevents enum/field drift while runtime handlers are implemented. |
| Executable QA conversion | issue #111 and issue #11 | Turns smoke/E2E docs into runnable assertions for happy and negative paths. |

### Remaining blocked slices

- Issue #11 remains blocked until #109 and #110 provide runnable endpoints and #111 turns the QA matrices into executable checks.
- Audit evidence remains partially blocked until PR #92 fields are emitted by runtime code in issue #110.

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Contract convergence + service bootstrap | PR #90 and issue #109 are the primary M1 gates. |
| M2 | Runnable publish/match/bid foundation | Issue #110 plus PR #66/#68 are the main gates. |
| M3 | Verify and audit durability | PR #83/#92 plus issue #111 are the main gates. |
| M4 | Beta readiness sign-off | Issue #11 final E2E evidence and security/audit verification remain required. |

## Epic Exit Checklist

- [ ] Upload and publish runtime paths are executable in a local service.
- [ ] Matching, verify-status, and award-read contracts are merged and consumed by runtime handlers.
- [ ] Audit trace outputs are emitted and queryable for beta review.
- [ ] QA smoke matrix and MVP E2E assertions are runnable and passing.
- [x] Security/compliance readiness checklist is merged and linked to QA validation.

## Review Routine

When epic #2 is updated, also review:
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- `docs/PHASE1_CHECKPOINT_BOARD.md`
- `docs/issues/PHASE1_ISSUES.md`
