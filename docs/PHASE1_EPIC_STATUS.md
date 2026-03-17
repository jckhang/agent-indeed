# Phase 1 Epic Status

Last updated: 2026-03-17

This document is the execution snapshot for epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`).
It complements `docs/PHASE1_GOALS.md` by mapping epic acceptance criteria to the current runtime issues and PR gates.

## Epic Objective

Deliver a closed-beta MVP for the agent dispatch loop:
`publish -> match -> commit -> reveal -> verify -> award`

## Acceptance Snapshot

| Epic acceptance area | Current status | Source of truth | Next gate |
| --- | --- | --- | --- |
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, issue #137, PR #140 | Keep the active runtime/doc threads (`#126`, `#127`, `#139`, `#140`) aligned to merged `main` contracts and make sure review-required validation evidence lives in the PR body, not just comments. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, issues #11, #109, #110, #111, PRs #126 and #127 | Merge the runnable backend slices and let issue #111 execute the smoke/E2E path against the real runtime before unblocking issue #11. |
| Core negative scenarios are covered | Blocked | issues #11 and #111, `docs/CLOSED_BETA_SECURITY_READINESS.md`, `docs/ERROR_CODE_RETRY_POLICY.md`, PR #127 | Turn the documented failure cases into executable assertions tied to the vertical-slice runtime and capture evidence back on issue #11. |
| Audit events cover key state transitions | In progress | issue #110, PR #127, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md` | Keep the award/proof/audit surfaces contract-aligned while issue #110 proves the emitted runtime trail and QA consumes it in issue #111. |

## Delivery Slice Status

### Completed baseline slices

- #3 AgentBundle contract baseline defined.
- #5 TaskSpec publish contract baseline defined.
- #55 candidate matching shortlist contract merged.
- #72 closed-beta security readiness checklist merged.
- Frontend baseline slices for manager/agent/operator surfaces are merged (#53, #56, #67, #70, #73, #74, #76, #78).
- Runtime planning control artifacts now exist for the current sprint cutline and blocker ledger (`docs/RUNTIME_CUTLINE_2026-03-16.md`, `docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md`).

### Active implementation slices

| Epic step | Active issue / PR | Why it still matters to epic #2 |
| --- | --- | --- |
| Runtime blocker control | issue #137 / PR #140 | Keeps the weekly runtime queue pointed at executable slices and names the next owner for each blocker before the 2026-03-20 checkpoint. |
| Runtime backend skeleton | issue #115 / issue #109 / PR #126 | Provides the first runnable control-plane service and persistence baseline. |
| Runnable dispatch vertical slice | issue #110 / PR #127 | Converts contract-only flow into executable state transitions across publish/match/bid/verify/award. |
| Frontend runtime integration | issue #136 / PR #139 | Keeps the frontend handoff limited to the merged runtime/API baseline so UI follow-ons do not outrun `main`. |
| Executable QA conversion | issue #120 / issue #111 / issue #11 | Turns smoke/E2E docs into runnable assertions for happy and negative paths once the backend runtime stabilizes. |

### Remaining blocked slices

- Issue #11 remains blocked until PR #126 and PR #127 provide a stable local runtime and issue #111 converts the QA matrix into executable evidence.
- PR #126 still needs the required validation evidence copied into the PR body before the bootstrap slice is merge-ready.
- PR #127 still needs the vertical-slice runtime branch to stay aligned with the published `bidId` contract and any follow-up review notes.
- PR #139 remains blocked on doc-to-contract drift for bid/proof status reads plus missing validation output in the PR body.
- PR #140 remains open until the runtime blocker ledger accurately mirrors the live review queue and owner handoffs.

## Runtime Execution Queue (2026-03-17)

| Thread | Current disposition | Why | Next owner / next action |
| --- | --- | --- | --- |
| PR #140 `docs: add runtime unblocker control ledger` | In review | The planning ledger is now the weekly owner/blocker source, but it has to stay synced to the live runtime review state. | `albatross-dev-agent`: keep the lane ledger updated as blocker comments land and use it to prep the 2026-03-20 epic checkpoint. |
| PR #126 `[P1-37] Bootstrap runnable control-plane backend skeleton` | Blocked | Review still requires literal validation evidence in the PR template/body before the runtime bootstrap slice can merge. | `kestrel`: move the already-run validation output into the PR body and keep the branch on current `origin/main`. |
| PR #127 `[P1-38] Implement runnable MVP dispatch vertical slice` | Blocked | The branch carries the main executable flow, but review still tracks contract-alignment follow-up on the bid-event route and any runtime drift. | `kestrel`: resolve the active contract note, rerun runtime validation, and repost exact output in the PR thread/body. |
| PR #139 `docs: add frontend runtime integration tranche` | Blocked | The tranche currently claims bid/proof status read behavior that is not present in merged contracts and is missing literal validation output in the PR body. | `lanzhou-fe-agent`: scope the doc set back to merged `main` contracts, paste validation output into the PR body, and keep the branch tied to issues #115/#110. |
| Issue #120 / issue #111 | Waiting on runtime | QA cannot close the weekly sweep until the backend runtime path becomes stable and reproducible from one documented command path. | `avery`: convert the matrices into executable checks as soon as the runtime branches settle. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Service bootstrap + queue control | Issue #137 / PR #140 and issue #115 / PR #126 are the current gates for a credible runtime baseline by 2026-03-20. |
| M2 | Runnable publish/match/bid foundation | Issue #110 / PR #127 plus issue #136 / PR #139 are the near-term gates for a contract-aligned runtime + frontend handoff. |
| M3 | Verify, audit, and executable QA | Issue #120 / issue #111 carry the burden of turning the merged runtime path into runnable smoke evidence tied back to issue #11. |
| M4 | Beta readiness sign-off | Issue #11 final E2E evidence and audit/security verification remain required. |

## Epic Exit Checklist

- [ ] Upload and publish runtime paths are executable in a local service.
- [ ] Active runtime and frontend handoff branches stay aligned with merged OpenSpec/OpenAPI/contracts.
- [ ] Audit trace outputs are emitted and queryable for beta review.
- [ ] QA smoke matrix and MVP E2E assertions are runnable and passing.
- [x] Security/compliance readiness checklist is merged and linked to QA validation.

## Review Routine

When epic #2 is updated, also review:
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- `docs/PHASE1_CHECKPOINT_BOARD.md`
- `docs/issues/PHASE1_ISSUES.md`
