# Phase 1 Epic Status

Last updated: 2026-03-15

This document is the execution snapshot for epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`).
It complements `docs/PHASE1_GOALS.md` by mapping the epic acceptance criteria to the current issue, PR,
and checkpoint state.

## Epic Objective

Deliver a closed-beta MVP for the agent dispatch loop:
`publish -> match -> commit -> reveal -> verify -> award`

## Acceptance Snapshot

| Epic acceptance area | Current status | Source of truth | Next gate |
| --- | --- | --- | --- |
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts` | Keep open PRs #55, #66, #68, #77 aligned with current spec/contracts. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, issue #11 | Needs remaining M2-M4 backend/UI contracts plus QA smoke matrix #79 and E2E issue #11. |
| Core negative scenarios are covered | Blocked | issue #11, issue #72, `docs/SECURITY_COMPLIANCE_BASELINE.md` | Convert merged security/readiness guidance into executable QA coverage after verifier and award flows settle. |
| Audit events cover key state transitions | In progress | issue #10, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md` | Land award/audit trace work after shortlist, status polling, and verifier outputs are stable. |

## Delivery Slice Status

### Completed baseline slices

- #3 AgentBundle contract defined.
- #4 Onboarding pipeline baseline implemented.
- #5 TaskSpec publish behavior defined.
- #7 Commit-reveal bidding APIs landed.
- #8 PoMW policy contract landed.

### Active implementation slices

| Epic step | Active issue / PR | Why it still matters to epic #2 |
| --- | --- | --- |
| Match | issue #6 / PR #55 | Matching shortlist contract is still the backend gate before publish -> match is stable. |
| Verify status reads | issue #59 / PR #66 | Async status polling is required so verification remains durable beyond synchronous responses. |
| Verify UX | issue #64 / PR #73 | Timeline UX is the first consumer-facing proof that verification results are understandable. |
| Agent commit/reveal UX | issue #63 / PR #76 | Agent workflow durability still depends on the status read contract landing. |
| Award reads | issue #58 / PR #68 | Manager shortlist and award-read contracts are still the main backend dependency before award review is trustworthy. |
| Award readiness UX | issue #62 / PR #78 | Manager award-readiness UI is the visible proof that shortlist -> award can be reviewed end to end. |
| Security gate | issue #72 / PR #77 | Closed-beta auth, secrets, and redaction guidance must merge before epic sign-off. |
| Planning sync | issue #80 / PR #82 | Planning docs must stay aligned so epic status is not tracking already-merged work as active. |
| QA smoke coverage | issue #79 / PR #84 | Smoke validation is the bridge between merged slices and final E2E confidence. |

### Remaining blocked slices

- #9 ProofPack verifier result codes still depend on the now-merged policy baseline and the still-open async status work.
- #10 Audit events and award trace still depend on M2 and M3 outputs landing in stable read/write contracts.
- #11 End-to-end tests and examples still depend on verifier, award-read, and smoke-matrix work becoming stable enough to automate.

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Upload baseline | Complete enough for kickoff; issue #30 can proceed from the merged contract baseline. |
| M2 | Publish, shortlist, and bid foundation | Still gated by PR #55 even though task composer work already merged. |
| M3 | Verify and agent flow | Policy baseline is merged; status reads and agent UX remain the active gate. |
| M4 | Award, audit, and beta readiness | Security, award-read, smoke coverage, and planning sync remain the open gates. |

## Epic Exit Checklist

- [x] Upload and publish baselines are documented and merged.
- [ ] Matching shortlist contract is merged and reflected in downstream docs/UI.
- [ ] Proof verification result codes and async status reads are merged.
- [ ] Award-read contracts and award-readiness UI are merged.
- [ ] Audit trace outputs are defined for beta review.
- [ ] QA smoke matrix and MVP E2E coverage are ready to run.
- [ ] Security/compliance readiness checklist is merged and linked to QA validation.

## Review Routine

When epic #2 is updated, also review:
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- `docs/PHASE1_CHECKPOINT_BOARD.md`
- `docs/issues/PHASE1_ISSUES.md`
