# Phase 1 Beta Readiness Gates

Last updated: 2026-03-16

This document turns epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`) into a small set of
reviewable release gates for closed-beta readiness. It complements:

- `docs/PHASE1_GOALS.md` for the MVP definition of done
- `docs/ROADMAP.md` for phase checkpoints and milestone dates
- `docs/PHASE1_EPIC_STATUS.md` for the current issue/PR rollup
- `docs/RUNTIME_CUTLINE_2026-03-16.md` for the runtime-start cutline on open contract deltas

## Gate Summary

| Gate | Status | Ready when | Active dependencies | Evidence to collect |
| --- | --- | --- | --- | --- |
| Contract convergence | In progress | Remaining backend contract PRs are merged and shared enum/error vocabulary is stable across OpenSpec, OpenAPI, and TypeScript contracts. | PR #66, PR #68, PR #83, PR #90, PR #92 | `openspec validate --all`, contract diff review, synced `src/api/openapi.yaml` + `src/api/contracts.ts` |
| Runtime happy-path execution | Blocked | One runnable `publish -> match -> commit -> reveal -> verify -> award` flow can be executed against a local service without manual interpretation. | Issue #109, issue #110, issue #111, issue #11, plus contract convergence gate | Service run command, executable smoke/E2E output, linked request/response evidence |
| Negative-scenario coverage | Blocked | QA can execute core failures (`invalid signature`, `reveal without commit`, `proof FAIL`, `award blocked`) with stable expected outcomes. | Issue #111, issue #11, PR #83, PR #92, `docs/ERROR_CODE_RETRY_POLICY.md`, `docs/CLOSED_BETA_SECURITY_READINESS.md` | Runnable assertions, expected error/result matrix, regression evidence |
| Audit evidence trail | In progress | Audit outputs expose key lifecycle transitions and award/proof context for operator review and beta sign-off. | Issue #110, PR #92, `docs/MVP_TELEMETRY_HANDOFF.md`, `docs/OBSERVABILITY_BASELINE.md` | Audit event names, award trace fields, telemetry handoff checklist |
| Execution + handoff hygiene | In progress | Roadmap/goals/epic/checkpoint docs and active runtime issues all describe the same blockers and next actions. | Issue #109, issue #110, issue #111, issue #11 | `docs/PHASE1_CHECKPOINT_BOARD.md`, `docs/PHASE1_EPIC_STATUS.md`, milestone/label queries stay aligned |

## Gate Details

### 1. Contract convergence

This remains the prerequisite for durable runtime behavior and executable QA checks.

- Verification status durability depends on PR #66.
- Manager shortlist and award reads depend on PR #68.
- Verifier terminal vocabulary and reason-code behavior depend on PR #83.
- Onboarding kickoff examples depend on PR #90.
- Audit event and award-trace surface depends on PR #92.

Release note: if any of these contracts change enum names, required fields, or error-code wording,
the same update must land in OpenSpec plus both API drafts before the gate can be marked ready.

### 2. Runtime happy-path execution

Happy-path readiness is now runtime-first, not docs-first.

While this gate remains blocked until the runnable flow exists, the runtime threads do not have to wait for every open contract PR. Use `docs/RUNTIME_CUTLINE_2026-03-16.md` to separate true blockers from additive-safe follow-ups.

Required outcome:

- a local service starts from one documented command
- one reproducible request sequence executes `publish -> match -> commit -> reveal -> verify -> award`
- results are captured by executable smoke/E2E checks tied to issue #111 and linked back to issue #11

Reference docs/matrices are useful only if they map directly to runnable assertions.

### 3. Negative-scenario coverage

Closed beta needs confidence in failure handling, not just the green path.

Minimum scenarios to keep visible:

- reveal submitted without a valid prior commit
- signature-invalid or malformed onboarding/task payload path
- proof verification returns `FAIL`
- award attempt blocked before prerequisite verification is complete

Expected output for each scenario must cite a stable error code or terminal status/result.

### 4. Audit evidence trail

Audit readiness is still the clearest M4 blocker after runtime flow and contract convergence.

The beta review pack should answer:

- what happened
- when it happened
- which task, bid, proof, and candidate were involved
- why the award decision was allowed or blocked

That evidence must come from shared audit/telemetry surfaces, not ad hoc reviewer notes.

### 5. Execution + handoff hygiene

This gate stays green only when the repo planning surfaces and GitHub runtime threads agree.

At minimum, these must stay in lockstep:

- `docs/PHASE1_CHECKPOINT_BOARD.md`
- `docs/PHASE1_EPIC_STATUS.md`
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- runtime delivery threads (`#109`, `#110`, `#111`, and blocked follow-through `#11`)

## Review Routine

Review these gates whenever one of the following happens:

- a Phase 1 contract/runtime PR merges, reopens, or is closed as superseded
- a contract enum or error-code changes
- QA smoke/E2E execution scope changes
- epic #2 checklist changes

If a gate changes status, update the epic rollup and checkpoint board in the same review window.
