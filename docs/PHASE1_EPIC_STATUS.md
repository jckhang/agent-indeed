# Phase 1 Epic Status

Last updated: 2026-03-18

This document is the execution snapshot for epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`).
It complements `docs/PHASE1_GOALS.md` by mapping epic acceptance criteria to the current runtime issues and PR gates.

## Epic Objective

Deliver a closed-beta MVP for the agent dispatch loop:
`publish -> match -> commit -> reveal -> verify -> award`

## Acceptance Snapshot

| Epic acceptance area | Current status | Source of truth | Next gate |
| --- | --- | --- | --- |
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, merged PRs #140 and #141, open PR #133, and open PR #153 | Keep the remaining planning/doc threads (`#133`, `#153`) aligned to the merged contract baseline on `main`, and treat merged PR #152 as the current consumer-baseline reference rather than an open queue item. |
| End-to-end happy path can be demonstrated | In progress | `docs/PHASE1_GOALS.md`, issue #11, issue #120, merged PRs #127, #129, and #149 | Treat the local runtime bootstrap and runnable dispatch path as landed baseline work, then capture one reproducible smoke/E2E evidence run before unblocking issue #11. |
| Core negative scenarios are covered | Blocked | issue #11, issue #120, merged PR #149, `docs/CLOSED_BETA_SECURITY_READINESS.md`, and `docs/ERROR_CODE_RETRY_POLICY.md` | Convert the documented failure cases into executable assertions against the merged runtime path and post the evidence back to the QA threads. |
| Audit events cover key state transitions | In progress | merged PRs #92, #127, and #129, `docs/OBSERVABILITY_BASELINE.md`, and `docs/MVP_TELEMETRY_HANDOFF.md` | Prove the emitted audit trail through the merged executable smoke suite on `main` and keep award/proof terminology aligned while issue #120 closes the remaining evidence gap. |

## Delivery Slice Status

### Completed baseline slices

- #3 AgentBundle contract baseline defined.
- #5 TaskSpec publish contract baseline defined.
- #55 candidate matching shortlist contract merged.
- #72 closed-beta security readiness checklist merged.
- Runnable control-plane baseline merged in PR #126; issue #109 is closed.
- Runnable dispatch vertical slice merged in PR #127 on 2026-03-17 13:54:46Z; issue #110 is closed.
- Runtime bootstrap smoke command merged in PR #129; issue #115 is closed.
- Frontend runtime integration tranche merged in PR #139; issue #136 is closed.
- Frontend runtime handoff queue collapsed in PR #147; issue #145 is closed.
- Runtime planning control artifacts now exist on `main` through merged PR #140 plus the dated blocker ledger (`docs/RUNTIME_CUTLINE_2026-03-16.md`, `docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md`).

### Active implementation slices

| Epic step | Active issue / PR | Why it still matters to epic #2 |
| --- | --- | --- |
| Verify/award contract adoption follow-through | open PR #133 | Keeps the verify/award checklist anchored to the published OpenAPI/TypeScript contracts so runtime and QA readers do not consume stale field or enum claims. |
| Executable runtime smoke suite | merged PR #149 | Turns the merged bootstrap + dispatch baseline into a repeatable test harness that QA can now run from `main` without rebuilding the old doc-only matrix by hand. |
| Runtime consumer verification | merged PR #152 | Keeps the frontend/QA handoff tied to the merged runtime routes and evidence vocabulary rather than the superseded runtime wiring branches. |
| Weekly execution audit playbook | open PR #153 | Converts the one-off runtime unblocker control issue into a durable planning routine for weekly owner handoff and merge-train follow-through. |
| QA contract-drift and E2E closeout | issue #120 / issue #11 | Carries the remaining happy-path, negative-path, and beta evidence burden now that issues #109, #110, #111, #115, #136, and #145 are closed. |

### Remaining blocked slices

- Issue #11 remains blocked until the merged runtime path is covered by executable smoke/E2E evidence rather than doc-only acceptance notes.
- Issue #120 is the active QA sweep for contract drift and runtime evidence; it now sits on top of the merged smoke-suite baseline from PR #149 instead of waiting on another runtime implementation branch.
- PR #152 is already merged, PR #133 remains in review, and PR #153 is merge-conflicting again, so the queue is smaller but still not approval-ready.
- Until those review threads re-close, treat the planning/consumer queue as active review work rather than merge-only follow-through.

## Runtime Execution Queue (2026-03-18)

| Thread | Current disposition | Why | Next owner / next action |
| --- | --- | --- | --- |
| merged PR #149 `test(runtime): add executable dispatch smoke suite` | Landed on `main` | The executable smoke suite is now the shared runtime evidence baseline for QA and planning follow-through. | `avery`: run the suite from `main`, post the current output back to issue #120 and issue #11, and treat regressions as follow-up bugs instead of doc gaps. |
| PR #133 `[P1-131] Add verify-award adoption checklist` | Clean branch, re-review pending | The checklist branch is back on top of current `main`, but the PR still has no recorded review decision after the latest queue churn. | `albatross-dev-agent` + maintainer: keep the posted validation evidence current and re-request review against the refreshed branch. |
| merged PR #152 `docs(frontend): verify runtime consumer baseline` | Landed on `main` | The runtime consumer verification doc is now part of the merged frontend/QA adoption baseline. | `lanzhou-fe-agent` + reviewers: use the merged consumer-baseline wording as the reference point for follow-on QA evidence instead of tracking it as open review work. |
| PR #153 `[P1-137] Add weekly execution audit playbook` | Dirty branch, rebase required | The planning follow-through drifted behind `main` again, so the branch must be rebased before it can return to active review. | `albatross-dev-agent`: rebase onto `origin/main`, rerun validation, paste literal output, then re-request review. |
| Issue #120 / issue #11 | Waiting on executable evidence | QA still needs one current smoke/E2E evidence pack that exercises the merged runtime path and cites stable negative-path expectations. | `avery`: run the smoke suite after PR #149 lands, then post evidence back to issue #120 and issue #11. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Service bootstrap + queue control | The bootstrap path, runtime blocker ledger, and consumer-baseline docs are already merged; the remaining M1 risk is closing the still-open planning queue (`#133`, `#153`) without reintroducing drift. |
| M2 | Runnable publish/match/bid foundation | Merged PRs #127, #129, and #149 now provide the local runnable + smoke baseline; the active execution drag is turning that baseline into current QA evidence on issue #120. |
| M3 | Verify, audit, and executable QA | Issue #120 and issue #11 now carry the burden of turning the merged runtime path into runnable smoke/E2E evidence with contract-aligned failure expectations. |
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
