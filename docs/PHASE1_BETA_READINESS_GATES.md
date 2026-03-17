# Phase 1 Beta Readiness Gates

Last updated: 2026-03-17

This document turns epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`) into a small set of
reviewable release gates for closed-beta readiness. It complements:

- `docs/PHASE1_GOALS.md` for the MVP definition of done
- `docs/ROADMAP.md` for phase checkpoints and milestone dates
- `docs/PHASE1_EPIC_STATUS.md` for the current issue/PR rollup
- `docs/RUNTIME_CUTLINE_2026-03-16.md` for the runtime-start cutline on open contract deltas
- `docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md` for the dated owner/blocker ledger during the 2026-03-20 push

## Gate Summary

| Gate | Status | Ready when | Active dependencies | Evidence to collect |
| --- | --- | --- | --- | --- |
| Contract convergence | In progress | Active runtime and handoff PRs stay inside the merged OpenSpec/OpenAPI/TypeScript baseline and carry reviewable validation evidence in the PR body. | PR #129 (merge-ready), PR #133 (doc alignment), PR #140, PR #141, merged PR #83, merged PR #92, merged PR #126, merged PR #127, merged PR #139 | `openspec validate --all`, runtime/OpenAPI diff review, synced `src/api/openapi.yaml` + `src/api/contracts.ts`, pasted validation output in PR templates |
| Runtime happy-path execution | Blocked | One runnable `publish -> match -> commit -> reveal -> verify -> award` flow can be executed against a local service without manual interpretation. | issue #115, PR #129, merged PR #127 baseline, issue #111, issue #11 | Service run command, executable smoke/E2E output, linked request/response evidence |
| Negative-scenario coverage | Blocked | QA can execute core failures (`invalid signature`, `reveal without commit`, `proof FAIL`, `award blocked`) with stable expected outcomes. | issue #120, issue #111, issue #11, merged PR #127 baseline, `docs/ERROR_CODE_RETRY_POLICY.md`, `docs/CLOSED_BETA_SECURITY_READINESS.md` | Runnable assertions, expected error/result matrix, regression evidence |
| Audit evidence trail | In progress | Audit outputs expose key lifecycle transitions and award/proof context for operator review and beta sign-off. | merged PR #127, merged PR #92, `docs/MVP_TELEMETRY_HANDOFF.md`, `docs/OBSERVABILITY_BASELINE.md` | Audit event names, award trace fields, telemetry handoff checklist |
| Execution + handoff hygiene | In progress | Roadmap/goals/epic/checkpoint docs and the live runtime queue all describe the same blockers and next actions. | issue #137, PR #140, PR #141, issue #115, PR #129, issue #120, issue #111, issue #11 | `docs/PHASE1_CHECKPOINT_BOARD.md`, `docs/PHASE1_EPIC_STATUS.md`, `docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md`, milestone/label queries stay aligned |

## Gate Details

### 1. Contract convergence

This remains the prerequisite for durable runtime behavior and executable QA checks.

- Verifier terminal vocabulary and award-trace expectations now come from merged PR #83 and merged PR #92.
- The merged runtime/frontend baseline is on `main` through PR #126 and PR #139; PR #127 merged on 2026-03-17 at 13:54:46Z, so the active convergence risk is now keeping merge-ready PR #129 plus the doc queue (`#133`, `#140`, `#141`) synced to the published contract vocabulary.
- PR #140 is the planning guardrail that keeps those threads tied to one dated blocker ledger instead of duplicating stale snapshots across long-lived docs.

Release note: if any active runtime branch changes enum names, required fields, route shapes, or error-code wording, the same update must land in OpenSpec plus both API drafts before the gate can be marked ready.

### 2. Runtime happy-path execution

Happy-path readiness is runtime-first, not docs-first.

While this gate remains blocked until the runnable flow exists, the runtime threads do not have to wait for every historical contract branch. Use `docs/RUNTIME_CUTLINE_2026-03-16.md` plus `docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md` to separate true blockers from additive-safe follow-ups.

Required outcome:

- a local service starts from one documented command
- one reproducible request sequence executes `publish -> match -> commit -> reveal -> verify -> award`
- results are captured by executable smoke/E2E checks tied to issue #111 and linked back to issue #11

Reference docs and planning notes are only useful if they map directly to runnable assertions and a stable local command path.

### 3. Negative-scenario coverage

Closed beta needs confidence in failure handling, not just the green path.

Minimum scenarios to keep visible:

- reveal submitted without a valid prior commit
- signature-invalid or malformed onboarding/task payload path
- proof verification returns `FAIL`
- award attempt blocked before prerequisite verification is complete

Expected output for each scenario must cite a stable error code or terminal status/result from the merged contract vocabulary.

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
- `docs/RUNTIME_UNBLOCKER_CONTROL_2026-03-17.md`
- runtime delivery threads (`#115`, merge-ready `#129`, doc-alignment `#133`, `#120`, `#111`, and blocked follow-through `#11`)

## Review Routine

Review these gates whenever one of the following happens:

- a Phase 1 contract/runtime PR merges, reopens, or is closed as superseded
- a contract enum or error-code changes
- QA smoke/E2E execution scope changes
- epic #2 checklist changes

If a gate changes status, update the epic rollup and checkpoint board in the same review window.
