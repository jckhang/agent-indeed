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
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, issue #120, `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md`, PRs #159, #133, #152, #153, #154, #161, #164, #165, and #166 | Merge the QA guard and keep the live runtime/doc queue aligned to merged `main` contracts with review comments anchored to the dated sweep or source files. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, issues #11, #111, #115, merged PR #127, and merged PR #129 | Finish the remaining runnable QA evidence follow-through and let issue #111 execute the smoke/E2E path against the stable local runtime before unblocking issue #11. |
| Core negative scenarios are covered | Blocked | issues #11 and #111, `docs/CLOSED_BETA_SECURITY_READINESS.md`, `docs/ERROR_CODE_RETRY_POLICY.md`, and merged PR #127 baseline | Turn the documented failure cases into executable assertions tied to the vertical-slice runtime and capture evidence back on issue #11. |
| Audit events cover key state transitions | In progress | merged PR #127, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md` | Keep the award/proof/audit surfaces contract-aligned while the open runtime follow-through proves the emitted trail and QA consumes it in issue #111. |

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
| QA contract-drift sweep | issue #120 / PR #159 | Keeps review comments anchored to one executable OpenAPI/contracts baseline while the remaining runtime/doc queue is still in review. |
| Verify/award contract adoption | issue #131 / PR #133 | Keeps verify/award checklist language aligned to the published reason-code, error-code, and read-route baseline on `main`. |
| Frontend runtime consumer docs | issue #150 / PR #152 | Keeps manager/agent runtime guidance inside the merged runtime read/write surface so downstream QA replay docs do not drift. |
| Weekly execution audit playbook | issue #137 / PR #153 | Keeps the planning lane pointed at the currently open runtime/doc queue and its owner/blocker state. |
| Backend API example packet | issue #163 / PR #164 | Publishes smoke-backed request/response examples that must stay aligned with the same task/bid/proof route baseline enforced by the QA guard. |
| Epic acceptance trace | issue #2 / PR #165 | Captures the current post-merge acceptance mapping so epic reviewers can follow the same runtime/doc queue without stale blocker references. |
| Executable QA conversion | issue #120 / issue #111 / issue #11 | Turns smoke/E2E docs into runnable assertions for happy and negative paths once the backend runtime follow-through stabilizes. |

### Remaining blocked slices

- Issue #11 remains blocked until merged PR #127 plus merged PR #129 are translated into final runnable QA evidence on issue #111.
- PR #127 merged on 2026-03-17 at 13:54:46Z, so the remaining backend queue risk is concentrated in PR #129 rather than the vertical-slice branch.
- The 2026-03-18 QA sweep now has a repo-local baseline in `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md`, so review comments can point at one dated contract snapshot instead of restating route/enum availability from memory.
- PRs #129, #140, and #141 merged on 2026-03-17, so the remaining runtime/doc queue risk is concentrated in open PRs #159, #153, #154, #161, #152, #133, #164, #165, and #166 staying aligned to the same merged baseline.

## Runtime Execution Queue (2026-03-18)

| Thread | Current disposition | Why | Next owner / next action |
| --- | --- | --- | --- |
| PR #159 `[P1-120] Add QA contract drift guard` | In review | This is the canonical route/enum guard for the current queue; merging it first lowers repeat review churn across the remaining runtime/doc PRs. | `avery`: keep the dated sweep synced to the live queue and point reviewers at `npm run check:contract-drift`. |
| PR #164 `[P1-163] Add backend API example packet from smoke flow` | In review | Smoke-backed examples are the next likely place for route/field drift if they describe unpublished task/bid/proof surfaces. | `kestrel`: keep example payloads inside the published OpenAPI/contracts baseline and cite the QA sweep where useful. |
| PR #165 `docs: add Phase 1 acceptance trace` | In review | The acceptance trace should describe the current merged baseline and open runtime/doc queue instead of superseded blocker snapshots. | `albatross-dev-agent`: keep the trace synced to merged PRs #129/#140/#141 and the open review queue. |
| PR #166 `docs: refresh epic checkpoint sweep guidance` | In review | The checkpoint sweep is another planning consumer of the same runtime/doc queue and should cite the dated QA sweep when route or enum availability is questioned. | `albatross-dev-agent`: keep the checkpoint notes aligned to the current review queue and merged baseline. |
| PR #161 `[P1-158] Rebalance merge queue checkpoints` | In review | Merge queue notes should reflect the same live contract/runtime queue so sequencing decisions do not cite superseded blockers. | `albatross-dev-agent`: keep merge queue ordering aligned to the current runtime/doc review set. |
| PR #154 `docs: refresh phase 1 epic runtime rollup` | In review | Older epic rollup refresh work is still open, so it needs the same merged-baseline cleanup as the newer planning follow-ups. | `albatross-dev-agent`: either converge this thread onto the current queue snapshot or close it as superseded. |
| PR #153 `[P1-137] Add weekly execution audit playbook` | In review | The weekly audit playbook is now a planning consumer of the same runtime/doc queue and should not diverge from the dated QA sweep. | `albatross-dev-agent`: keep queue ordering and blocker language aligned to the live GitHub state. |
| PR #152 `docs(frontend): verify runtime consumer baseline` | In review | Frontend runtime guidance must cite only the published task/bid/proof surfaces and verifier vocabulary already on `main`. | `lanzhou-fe-agent`: keep consumer claims anchored to published routes, fields, and enums. |
| PR #133 `[P1-131] Add verify-award adoption checklist` | In review | Verify/award adoption notes still need to stay precise about which reason codes, error codes, and read surfaces are actually published. | `albatross-dev-agent`: keep the checklist language tied to the current OpenAPI/contracts baseline. |
| Issue #120 / issue #111 | QA sweep in progress | QA now has a dated contract-drift guard plus a 2026-03-18 route/enum baseline, but issue #11 still waits on the final runtime smoke/E2E evidence handoff. | `avery`: use `npm run check:contract-drift` plus the sweep doc while reviewing runtime/doc PRs, then keep issue #11 focused on executable smoke/E2E evidence. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Service bootstrap + queue control | Merged PRs #129 and #140 provide the baseline; the remaining near-term gate is keeping PRs #159, #153, #154, #161, #165, and #166 aligned to that live queue state. |
| M2 | Runnable publish/match/bid foundation | Merged PR #127 provides the runnable dispatch baseline; the remaining runtime execution drag is keeping PRs #164, #152, and #133 aligned to the published contracts. |
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
