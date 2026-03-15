# Phase 1 Epic Status

Last updated: 2026-03-16

This document is the execution snapshot for epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`).
It complements `docs/PHASE1_GOALS.md` by mapping the epic acceptance criteria to the current issue, PR,
and checkpoint state.

## Epic Objective

Deliver a closed-beta MVP for the agent dispatch loop:
`publish -> match -> commit -> reveal -> verify -> award`

## Acceptance Snapshot

| Epic acceptance area | Current status | Source of truth | Next gate |
| --- | --- | --- | --- |
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts` | Keep open PRs #55, #66, #68, #83, #90, and #92 aligned with the current spec/contracts surface. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, issue #11 | Needs the remaining M2-M4 contract PRs plus QA handoff docs (#84, #95, #96) before issue #11 can turn into executable coverage. |
| Core negative scenarios are covered | Blocked | issue #11, `docs/CLOSED_BETA_SECURITY_READINESS.md`, `docs/ERROR_CODE_RETRY_POLICY.md` | Security-readiness guidance is merged; the next gate is converting it into smoke/E2E assertions once verifier and award traces stabilize. |
| Audit events cover key state transitions | In progress | issue #10, PR #92, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md` | Land audit-event stream and award-trace contracts, then fold them into the QA example and smoke-pack work. |

## Delivery Slice Status

### Completed baseline slices

- #3 AgentBundle contract defined.
- #4 Onboarding pipeline baseline implemented.
- #5 TaskSpec publish behavior defined.
- #7 Commit-reveal bidding APIs landed.
- #8 PoMW policy contract landed.
- #72 Closed-beta security readiness checklist merged.
- #62 Award-readiness UI slice merged.
- #63 Agent bid commit/reveal workspace UI merged.
- #64 Verification timeline UX merged.
- #93 QA-facing MVP API example outline scope closed and handed to PR #96.
- #94 Frontend data-gap capture scope closed and handed to PR #95.

### Active implementation slices

| Epic step | Active issue / PR | Why it still matters to epic #2 |
| --- | --- | --- |
| Match | issue #6 (closed) / PR #55 | Matching shortlist contract is still the backend gate before publish -> match is stable. |
| Verify status reads | issue #59 / PR #66 | Async status polling is required so verification remains durable beyond synchronous responses. |
| Verifier contract | issue #9 (closed) / PR #83 | The canonical verifier/result contract still has to merge before downstream QA examples and polling semantics are fully stable. |
| Award reads | issue #58 (closed) / PR #68 | Manager shortlist and award-read contracts are still the main backend dependency before award review is trustworthy. |
| Audit trace | issue #10 / PR #92 | Audit-event stream and award-trace contracts are now the main backend gate for the beta evidence trail. |
| Planning sync | issue #80 / PR #82 | Planning docs must stay aligned so epic status is not tracking already-merged work as active. |
| QA smoke coverage | issue #87 / PR #84 | Smoke validation is the bridge between the merged UI slices and final E2E confidence. |
| QA handoff pack | issue #11, PR #95, PR #96 | The QA-facing API outline and frontend data-gap docs still need to merge so smoke and E2E work use one current handoff set. |

### Remaining blocked slices

- #10 Audit events and award trace still depend on the M2/M3 contracts landing in stable read/write forms and merging through PR #92.
- #11 End-to-end tests and examples still depend on verifier, award-read, audit-trace, and smoke-pack work becoming stable enough to automate.

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Upload baseline | Issue #30 is closed; PR #90 is the only remaining M1 example/kickoff thread. |
| M2 | Publish, shortlist, and bid foundation | Still gated by PR #55 even though manager task-composer and shortlist UI slices are merged. |
| M3 | Verify and agent flow | Agent UX slices are merged; status reads (#66) and verifier contract finalization (#83) remain the active gate. |
| M4 | Award, audit, and beta readiness | Security is merged, but award-read, audit-trace, smoke coverage, QA handoff docs, and planning sync still need to close. |

## Epic Exit Checklist

- [x] Upload and publish baselines are documented and merged.
- [ ] Matching shortlist contract is merged and reflected in downstream docs/UI.
- [ ] Proof verification result codes and async status reads are merged.
- [ ] Award-read contracts and award-readiness UI are merged.
- [ ] Audit trace outputs are defined for beta review.
- [ ] QA smoke matrix and MVP E2E coverage are ready to run.
- [x] Security/compliance readiness checklist is merged and linked to QA validation.

## Review Routine

When epic #2 is updated, also review:
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- `docs/PHASE1_CHECKPOINT_BOARD.md`
- `docs/issues/PHASE1_ISSUES.md`
