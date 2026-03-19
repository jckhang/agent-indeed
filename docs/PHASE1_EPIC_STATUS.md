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
| OpenSpec/API/contracts stay synchronized | In progress | `openspec/changes/agent-dispatch-platform/`, `src/api/openapi.yaml`, `src/api/contracts.ts`, `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md`, PR #133, PR #204, PR #208, and PR #211 | Keep the verify/award and onboarding upload follow-through inside the merged contract vocabulary, and remove closed-thread dependencies from the epic gate docs. |
| End-to-end happy path can be demonstrated | Blocked | `docs/PHASE1_GOALS.md`, `docs/RUNTIME_EXECUTION_HANDOFF.md`, PR #191, PR #204, issue #11, and issue #206 | Merge the backend handoff plus onboarding upload path, then publish one signed smoke rerun that covers both the canonical dispatch flow and the upload entrypoint. |
| Core negative scenarios are covered | Blocked | issue #11, issue #206, PR #204, `docs/BACKEND_API_EXAMPLE_PACKET.md`, `docs/CLOSED_BETA_SECURITY_READINESS.md`, and `docs/ERROR_CODE_RETRY_POLICY.md` | Re-run the bounded rejection paths on current `main`, including onboarding replay/hash-mismatch, `reveal without commit`, `proof FAIL`, and `award blocked`. |
| Audit events cover key state transitions | In progress | merged runtime baseline from issues #109/#110, `docs/OBSERVABILITY_BASELINE.md`, `docs/MVP_TELEMETRY_HANDOFF.md`, issue #11, and PR #191 | Keep award/proof trace expectations aligned with the merged runtime and prove the emitted task/proof/audit trail in the next issue #11 evidence rerun. |

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
| Verify/award contract adoption | PR #133 | The checklist still needs to describe only the proof fields, error codes, and reason-code vocabulary that are actually published on `main`. |
| Onboarding upload execution | PR #204, issue #205, and issue #206 | Epic #2 still needs one executable upload slice, one frontend follow-through, and one QA publication thread before the M1 gate can claim upload readiness. |
| Onboarding runtime handoff and gate tracking | PR #208 and PR #211 | These planning docs keep the onboarding upload queue visible in the same epic/checkpoint surfaces that reviewers already use for issue #11 and beta-readiness checks. |
| Issue #11 backend evidence handoff | PR #191 and issue #11 | Backend still needs one mainline evidence path so QA and planning can rerun the same bounded command sequence without reconstructing it from old PR comments. |
| QA evidence publication | issue #206 and issue #11 | The remaining QA work is to post one signed rerun that reuses the canonical handoff contract for both the dispatch flow and the onboarding upload route. |

### Remaining blocked slices

- Issue #11 remains the live end-to-end evidence gate for epic #2, and issue #206 is the onboarding-specific QA companion thread.
- PR #204 and PR #191 still need review/merge before the epic can claim both executable upload coverage and one canonical backend evidence path on `main`.
- PR #133 remains blocked on contract-vocabulary drift until its checklist matches the published OpenAPI and TypeScript contracts.

## Next 24h Merge Sequence

| Order | Thread | Why now | Expected result |
| --- | --- | --- | --- |
| 1 | PR #204 `feat: add executable agent onboarding runtime upload` | The upload route is the largest remaining M1 gap that still blocks the epic from claiming executable onboarding coverage. | `main` gains the runtime upload entrypoint that issue #205 and issue #206 can review and exercise. |
| 2 | PR #191 `[P1-43] Converge issue #11 backend handoff on one mainline path` | Backend-owned evidence formatting is the fastest way to make the final smoke rerun deterministic. | Issue #11 gets one canonical backend handoff path that QA and planning can reuse verbatim. |
| 3 | PR #208 `docs: add onboarding runtime handoff` | The onboarding upload queue needs one stable handoff contract instead of fragmented PR comments. | Reviewers can point frontend and QA follow-through at one reusable upload checklist. |
| 4 | PR #211 `docs: sync onboarding upload gate tracking` | Epic and beta-readiness docs still need to call out the live onboarding upload queue instead of only the pre-upload runtime lane. | M1/M2 planning surfaces keep PR #204 plus issues #205/#206 visible during checkpoint review. |
| 5 | PR #133 plus issue #11 / issue #206 rerun | Contract wording and executable evidence still need to converge after the upload and backend handoff threads settle. | Verify/award vocabulary and signed smoke evidence both line up with the merged runtime baseline. |

## Checkpoint Rollup

| Checkpoint | Epic relevance | Current note |
| --- | --- | --- |
| M1 | Onboarding upload review plus gate hygiene | The immediate M1 gate is merging PR #204 while keeping PR #208, PR #211, and PR #133 aligned to the same current-state epic language. |
| M2 | Backend handoff and frontend upload follow-through | PR #191 and issue #205 keep the merged runtime slice reviewable while the upload path and evidence handoff settle on `main`. |
| M3 | Verify, audit, and executable QA | Issue #11 plus issue #206 carry the remaining signed smoke evidence burden for the merged dispatch and onboarding upload flows. |
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
