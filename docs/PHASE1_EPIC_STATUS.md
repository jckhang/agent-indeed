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
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md`, merged PRs #152, #159, and #164, plus open PRs #133, #153, #154, #161, #165, and #166 | Keep the merged 2026-03-18 contract/runtime doc baseline stable while the remaining planning and verify/award PRs converge on the same `main` state. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, issue #11, issue #115, merged PR #127, merged PR #129, and closed issue #111 | Finish the remaining runnable QA evidence follow-through on issue #11 against the already-merged runtime path. |
| Core negative scenarios are covered | Blocked | issue #11, `docs/CLOSED_BETA_SECURITY_READINESS.md`, `docs/ERROR_CODE_RETRY_POLICY.md`, merged PR #127 baseline, and closed issue #111 | Turn the documented failure cases into executable assertions tied to the merged vertical-slice runtime and capture evidence back on issue #11. |
| Audit events cover key state transitions | In progress | merged PR #127, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md`, and issue #11 | Keep the award/proof/audit surfaces contract-aligned while issue #11 gathers the final runnable evidence against the merged runtime path. |

## Delivery Slice Status

### Completed baseline slices

- #3 AgentBundle contract baseline defined.
- #5 TaskSpec publish contract baseline defined.
- #55 candidate matching shortlist contract merged.
- #72 closed-beta security readiness checklist merged.
- Runnable control-plane baseline merged in PR #126; issue #109 is closed.
- Runnable dispatch vertical slice is merged through PRs #127, #129, #140, and #141; issue #110 is closed.
- Executable smoke/E2E conversion issue #111 is closed, so the remaining QA proof thread is issue #11.
- Frontend runtime integration tranche merged in PR #139; issue #136 is closed.
- Runtime planning control artifacts now exist for the current sprint cutline and blocker ledger (`docs/RUNTIME_CUTLINE_2026-03-16.md`, `docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md`).
- PR #152 merged on 2026-03-18 15:04:46Z, and PRs #159 plus #164 merged on 2026-03-18 15:24 UTC, establishing the current post-runtime doc/API baseline.

### Active implementation slices

| Epic step | Active issue / PR | Why it still matters to epic #2 |
| --- | --- | --- |
| Verify/award contract adoption | issue #131 / PR #133 | Keeps verify/award checklist language aligned to the published reason-code, error-code, and read-route baseline on `main`. |
| Planning queue cleanup | issue #167 / PRs #153, #154, #161, #165, and #166 | Keeps roadmap, checkpoint, audit-playbook, and epic-trace docs aligned with the merged 2026-03-18 baseline and the current merge order. |
| Frontend residual cleanup | issue #168 / PR #170 | Keeps downstream frontend/runtime guidance aligned after PR #152 merged. |
| Final runnable QA evidence | issue #11 | Turns the merged smoke/E2E groundwork into the final happy-path and negative-path evidence required for beta readiness. |

### Remaining blocked slices

- Issue #11 remains blocked until the merged runtime path is backed by final runnable QA evidence and API examples in the issue thread itself.
- PR #127 merged on 2026-03-17 at 13:54:46Z, and PRs #129, #140, and #141 merged later that day, so the runtime branch risk has shifted from implementation bootstrap to evidence and planning drift.
- The 2026-03-18 QA sweep now has a repo-local baseline in `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md`, so review comments can point at one dated contract snapshot instead of restating route/enum availability from memory.
- With PR #152 merged at 2026-03-18 15:04:46Z and PRs #159 plus #164 merged at 2026-03-18 15:24 UTC, the remaining queue risk is concentrated in open PRs #133, #153, #154, #161, #165, #166, and #170 staying aligned to the same merged baseline.

## Merge Queue (2026-03-18 post-runtime baseline)

| Thread | Current disposition | Why | Next owner / next action |
| --- | --- | --- | --- |
| PR #154 `docs: refresh phase 1 epic runtime rollup` | LGTM, waiting to merge | This is the cleanest planning refresh and already describes the merged runtime baseline rather than the old bootstrap blockers. | `albatross-dev-agent`: merge first in the next 24h so other planning docs can cite the same rollup. |
| PR #165 `docs: add Phase 1 acceptance trace` | LGTM, waiting to merge | The acceptance trace becomes the stable anchor for checkpoint comments once the rollup is current. | `albatross-dev-agent`: merge immediately after PR #154 unless a new blocker appears. |
| PR #161 `[P1-158] Rebalance merge queue checkpoints` | Re-review requested, fixes pushed | The merge-order guide must match the same post-2026-03-18 queue and no longer cite stale planning sweep threads. | `albatross-dev-agent`: wait for reviewer acknowledgement, then merge after PRs #154 and #165. |
| PR #166 `docs: refresh epic checkpoint sweep guidance` | Re-review requested, fixes pushed | The checkpoint guide is the next planning consumer that must point at live GitHub sweeps rather than stale repo-local blocker references. | `albatross-dev-agent`: merge after PR #161 if the reviewer agrees with the wording cleanup. |
| PR #153 `[P1-137] Add weekly execution audit playbook` | In review | The audit playbook should inherit the same merged-baseline queue wording after the checkpoint and rollup docs settle. | `albatross-dev-agent`: refresh only if reviewers ask for post-2026-03-18 queue updates, then merge behind the planning tranche. |
| PR #133 `[P1-131] Add verify-award adoption checklist` | Re-review requested, fixes pushed | Verify/award docs remain the main non-planning drift risk now that contract-drift and API example baselines are merged. | `albatross-dev-agent`: merge once the reviewer confirms the rebased checklist keeps to published routes, enums, and reason codes. |
| PR #170 `[P1-168] Trim frontend runtime residual gaps` | In review | Frontend residual cleanup is the active downstream consumer after PR #152 landed. | `lanzhou-fe-agent`: keep the residual doc/API claims anchored to the merged runtime surface. |
| Issue #11 | Open blocker | Final beta-readiness proof still requires runnable happy-path and negative-path evidence attached to the issue thread. | `avery`: post the final local smoke/E2E evidence and API example links without reopening closed runtime bootstrap issues. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Service bootstrap + queue control | The runtime/control baseline is merged; the near-term gate is issue #167 plus PRs #154, #161, #165, and #166 keeping milestone guidance aligned to the same 2026-03-18 queue state. |
| M2 | Runnable publish/match/bid foundation | The runnable dispatch baseline is merged; the remaining drag is PR #133 plus PR #170 staying aligned to the published contracts and runtime surface. |
| M3 | Verify, audit, and executable QA | Issue #11 now carries the burden of turning the merged runtime path into final runnable smoke evidence and negative-path proof. |
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
