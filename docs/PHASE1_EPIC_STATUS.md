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
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts` | Close the remaining runtime contract review queue on PRs #66 and #68, and keep PR #122 aligned to the merged `main` contract baseline. |
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
| Contract convergence | PRs #66, #68, #122 (`#83`, `#90`, and `#92` already merged) | Prevents enum/field drift while runtime handlers are implemented and frontend/runtime handoffs stay grounded in merged contracts. |
| Executable QA conversion | issue #111 and issue #11 | Turns smoke/E2E docs into runnable assertions for happy and negative paths. |

### Remaining blocked slices

- Issue #11 remains blocked until #109 and #110 provide runnable endpoints and #111 turns the QA matrices into executable checks.
- PR #66 remains blocked on final OpenAPI/TypeScript sync for the bid/proof status read surface before it can stop churning downstream reviewers.
- PR #68 remains blocked on removing duplicate contract declarations so shortlist/award read models can merge cleanly on top of current `main`.
- PR #122 remains blocked on keeping the frontend runtime wiring doc limited to endpoints and award-read behavior that are already present on `main`.
- Audit evidence remains partially blocked until PR #92 fields are emitted by runtime code in issue #110.

## Runtime Contract Queue (2026-03-16)

| Thread | Current disposition | Why | Next owner / next action |
| --- | --- | --- | --- |
| PR #66 `Define bid/proof status polling contract` | Blocked | Latest review still shows schema drift on proof-status enum publication and bid-status reason-code alignment between `src/api/openapi.yaml` and `src/api/contracts.ts`. | `albatross-dev-agent`: collapse the remaining enum/schema mismatch into one canonical shape, rerun `openspec validate --all`, and reply with exact validation output. |
| PR #68 `[P1-17] Define manager shortlist and award read-model contracts` | Blocked | The branch still reintroduces duplicate request/response type declarations that now conflict with the canonical contracts on `main`. | `albatross-dev-agent`: rebase on current `origin/main`, remove duplicate type blocks, and keep the PR scoped to shortlist/award read models only. |
| PR #83 `[P1-07] Define ProofPack verifier contract` | Merged | The verifier payload and error vocabulary are now the merged baseline for runtime verify work. | Runtime owners: consume the merged verifier fields in issue #110 instead of waiting on further review. |
| PR #121 `[P1-40] Publish runtime contract cutline` | Merged | The sprint cutline is already published and now reflects the merged-state references for PRs #90 and #92. | Planning lane: keep using `docs/RUNTIME_CUTLINE_2026-03-16.md` as the go/no-go reference; no further PR action required. |
| PR #122 `docs: define frontend runtime wiring target` | Blocked | The frontend handoff still needs to stay strictly within the merged runtime contract baseline and keep award-read explicitly blocked where no dedicated read model exists yet. | `lanzhou-fe-agent`: trim or clarify any award-read/audit-read wording that outruns `main`, then repost validation evidence on the rebased branch. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Contract convergence + service bootstrap | Issue #109 plus the remaining review queue on PRs #66/#68 are the primary M1 cleanup gates. |
| M2 | Runnable publish/match/bid foundation | Issue #110 plus a contract-aligned frontend/runtime handoff in PR #122 are the main near-term gates. |
| M3 | Verify and audit durability | Merged PRs #83/#92 establish the contract baseline; issue #111 now carries the executable verification burden. |
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
