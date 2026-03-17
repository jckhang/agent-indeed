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
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, issue #137, PRs #140 and #141 | Keep the active runtime/doc threads (`#127`, `#129`, `#140`, `#141`) aligned to merged `main` contracts while the remaining review queue is worked down to the last concrete blockers. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, issues #11, #111, #115, PRs #127 and #129 | Finish the remaining open runtime follow-through and let issue #111 execute the smoke/E2E path against the stable local runtime before unblocking issue #11. |
| Core negative scenarios are covered | Blocked | issues #11 and #111, `docs/CLOSED_BETA_SECURITY_READINESS.md`, `docs/ERROR_CODE_RETRY_POLICY.md`, PR #127 | Turn the documented failure cases into executable assertions tied to the vertical-slice runtime and capture evidence back on issue #11. |
| Audit events cover key state transitions | In progress | PR #127, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md` | Keep the award/proof/audit surfaces contract-aligned while the open runtime follow-through proves the emitted trail and QA consumes it in issue #111. |

## Delivery Slice Status

### Completed baseline slices

- #3 AgentBundle contract baseline defined.
- #5 TaskSpec publish contract baseline defined.
- #55 candidate matching shortlist contract merged.
- #72 closed-beta security readiness checklist merged.
- Runnable control-plane baseline merged in PR #126; issue #109 is closed.
- Frontend runtime integration tranche merged in PR #139; issue #136 is closed.
- Runtime planning control artifacts now exist for the current sprint cutline and blocker ledger (`docs/RUNTIME_CUTLINE_2026-03-16.md`, `docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md`).

### Active implementation slices

| Epic step | Active issue / PR | Why it still matters to epic #2 |
| --- | --- | --- |
| Runtime blocker control | issue #137 / PR #140 | Keeps the weekly runtime queue pointed at executable slices and names the next owner for each blocker before the 2026-03-20 checkpoint. |
| Epic + beta rollup refresh | issue #2 / PR #141 | Keeps the long-lived epic and gate docs aligned to the live post-merge runtime queue instead of stale blocker snapshots. |
| Backend bootstrap follow-up | issue #115 / PR #129 | Adds the standalone bootstrap smoke path that QA and reviewers can execute against the merged runtime baseline. |
| Runnable dispatch follow-through | closed issue #110 / PR #127 | Finishes the remaining vertical-slice cleanup on top of merged `main` so the happy path and audit trail are cleanly reviewable. |
| Executable QA conversion | issue #120 / issue #111 / issue #11 | Turns smoke/E2E docs into runnable assertions for happy and negative paths once the backend runtime follow-through stabilizes. |

### Remaining blocked slices

- Issue #11 remains blocked until PR #127 and PR #129 provide a stable local runtime and issue #111 converts the QA matrix into executable evidence.
- PR #129 is still blocked because the branch is merge-conflicting and the PR body still does not include the literal validation output for `npm test`, `npm run smoke:bootstrap`, OpenSpec validation, diff-check, and the pre-push guard.
- PR #127 is now back on the latest `main`, carries fresh validation output from the 2026-03-17T13:04Z rebase, and is mergeable; the remaining backend queue risk is concentrated in PR #129 rather than the vertical-slice branch.
- PR #140 and PR #141 remain open until the blocker ledger and epic/beta rollups match the live post-merge queue (`#127`/`#129` open; `#126`/`#139` merged).

## Runtime Execution Queue (2026-03-17)

| Thread | Current disposition | Why | Next owner / next action |
| --- | --- | --- | --- |
| PR #140 `docs: add runtime unblocker control ledger` | In review | The planning ledger is now the dated owner/blocker source, but it has to stay synced to the live post-merge runtime queue. | `albatross-dev-agent`: keep the lane ledger current and close the loop on re-review. |
| PR #141 `docs: refresh phase 1 epic runtime rollup` | In review | The epic and beta readiness rollups need to describe the current queue (`#127` mergeable, `#129` blocked, `#140`/`#141` in review) instead of the already-merged blockers. | `albatross-dev-agent`: refresh the epic/beta docs from live GitHub state and close the re-review thread. |
| PR #129 `feat: add runtime bootstrap smoke command` | Blocked | The smoke harness work landed, but review still requires pasted literal validation output in the PR body before merge. | `kestrel`: paste the exact command output in the PR body, rerun if needed, and re-request review. |
| PR #127 `[P1-38] Implement runnable MVP dispatch vertical slice` | Ready to merge | The branch has been rebased onto current `main`, fresh validation output is posted, and Avery re-confirmed `LGTM` on the refreshed head. | `kestrel`: keep the posted evidence in the PR body and merge once the queue is clear. |
| Issue #120 / issue #111 | Waiting on runtime | QA cannot close the weekly sweep until the backend runtime path becomes stable and reproducible from one documented command path. | `avery`: convert the matrices into executable checks as soon as PR #127 and PR #129 settle. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Service bootstrap + queue control | Issue #137 / PR #140 and issue #115 / PR #129 are the current gates for a credible runtime baseline by 2026-03-20. |
| M2 | Runnable publish/match/bid foundation | PR #127 is now mergeable on the latest base; the remaining runtime execution drag is PR #129's unresolved validation-evidence + rebase cleanup. |
| M3 | Verify, audit, and executable QA | Issue #120 / issue #111 carry the burden of turning the merged runtime path into runnable smoke evidence tied back to issue #11. |
| M4 | Beta readiness sign-off | Issue #11 final E2E evidence and audit/security verification remain required. |

## Epic Exit Checklist

- [ ] Upload and publish runtime paths are executable in a local service.
- [ ] Active runtime follow-through branches stay aligned with merged OpenSpec/OpenAPI/contracts.
- [ ] Audit trace outputs are emitted and queryable for beta review.
- [ ] QA smoke matrix and MVP E2E assertions are runnable and passing.
- [x] Security/compliance readiness checklist is merged and linked to QA validation.

## Review Routine

When epic #2 is updated, also review:
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- `docs/PHASE1_CHECKPOINT_BOARD.md`
- `docs/issues/PHASE1_ISSUES.md`
