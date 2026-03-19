# Phase 1 Beta Readiness Gates

Last updated: 2026-03-20

This document turns epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`) into a small set of
reviewable release gates for closed-beta readiness. It complements:

- `docs/PHASE1_GOALS.md` for the MVP definition of done
- `docs/ROADMAP.md` for phase checkpoints and milestone dates
- `docs/PHASE1_EPIC_STATUS.md` for the current issue/PR rollup
- `docs/RUNTIME_CUTLINE_2026-03-16.md` for the runtime-start cutline on open contract deltas
- `docs/RUNTIME_EXECUTION_HANDOFF.md` plus issue #11 for the canonical runnable evidence path on current `main`
- the live planning sweep query for same-day blocker/handoff checks instead of closed historical sweep issues

## Gate Summary

| Gate | Status | Ready when | Active dependencies | Evidence to collect |
| --- | --- | --- | --- | --- |
| Contract convergence | In progress | Active runtime and handoff PRs stay inside the merged OpenSpec/OpenAPI/TypeScript baseline and carry reviewable validation evidence in the PR body. | issue #11, `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md`, PR #133, PR #191, PR #204, merged PR #83, merged PR #92, merged PR #126, merged PR #127, merged PR #129, merged PR #139, merged PR #140, merged PR #141 | `openspec validate --all`, `npm run check:contract-drift`, runtime/OpenAPI diff review, synced `src/api/openapi.yaml` + `src/api/contracts.ts`, pasted validation output in PR templates |
| Runtime happy-path execution | Blocked | One runnable `publish -> match -> commit -> reveal -> verify -> award` flow can be executed against a local service without manual interpretation, and the onboarding upload entrypoint is reviewable with the same evidence discipline. | `docs/RUNTIME_EXECUTION_HANDOFF.md`, PR #191, PR #204, issue #11, and issue #206 | Service run command, executable smoke/E2E output, linked request/response evidence |
| Negative-scenario coverage | Blocked | QA can execute core failures (`invalid signature`, onboarding payload rejection, `reveal without commit`, `proof FAIL`, `award blocked`) with stable expected outcomes. | issue #11, issue #206, PR #204, `docs/BACKEND_API_EXAMPLE_PACKET.md`, `docs/ERROR_CODE_RETRY_POLICY.md`, `docs/CLOSED_BETA_SECURITY_READINESS.md` | Runnable assertions, expected error/result matrix, regression evidence |
| Audit evidence trail | In progress | Audit outputs expose key lifecycle transitions and award/proof context for operator review and beta sign-off. | merged PR #127, merged PR #92, `docs/MVP_TELEMETRY_HANDOFF.md`, `docs/OBSERVABILITY_BASELINE.md`, issue #11, and PR #191 | Audit event names, award trace fields, telemetry handoff checklist |
| Execution + handoff hygiene | In progress | Roadmap/goals/epic/checkpoint docs and the live runtime queue all describe the same blockers and next actions. | PR #133, PR #191, PR #204, PR #208, PR #211, issue #11, issue #205, issue #206, and the current `owner:albatross` + `stream/review-burndown` planning sweep | `docs/PHASE1_CHECKPOINT_BOARD.md`, `docs/PHASE1_EPIC_STATUS.md`, `docs/ROADMAP.md`, current planning sweep query, issue #11 evidence thread, milestone/label queries stay aligned |

## Gate Details

### 1. Contract convergence

This remains the prerequisite for durable runtime behavior and executable QA checks.

- Verifier terminal vocabulary and award-trace expectations now come from merged PR #83 and merged PR #92.
- The merged runtime/frontend baseline is on `main` through PR #126 and PR #139; PR #127 merged on 2026-03-17 at 13:54:46Z and PRs #129, #140, and #141 all merged later that day, so the active convergence risk is now keeping the surviving live review queue (`#133`, `#191`, `#204`) synced to the published contract vocabulary instead of reopening older contract snapshots.
- PR #204 adds the executable `POST /v1/agents/bundles` path on top of that merged baseline, so onboarding upload review now belongs in the same contract gate instead of living as a detached follow-up.
- The dated QA sweep in `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md` records which runtime routes are actually published on `main`, so reviewers can distinguish proof-enum drift from still-pending read-model routes without treating closed issues as current work.

Release note: if any active runtime branch changes enum names, required fields, route shapes, or error-code wording, the same update must land in OpenSpec plus both API drafts before the gate can be marked ready.

### 2. Runtime happy-path execution

Happy-path readiness is runtime-first, not docs-first.

While this gate remains blocked until the runnable flow exists, the runtime threads do not have to wait for every historical contract branch. Use `docs/RUNTIME_CUTLINE_2026-03-16.md` plus `docs/RUNTIME_EXECUTION_HANDOFF.md`, issue #11, and issue #206 to separate true blockers from additive-safe follow-ups.

The same rule now applies to onboarding upload follow-through: PR #204 is the executable runtime slice, issue #205 is the post-merge frontend surface sync, and issue #206 is the QA publication thread that should carry smoke evidence once the route lands on `main`.

Required outcome:

- a local service starts from one documented command
- one reproducible request sequence executes `publish -> match -> commit -> reveal -> verify -> award`
- one reproducible onboarding upload sequence executes `POST /v1/agents/bundles` with create, replay, and rejection evidence once PR #204 merges
- results are captured by the canonical signed issue #11 evidence path (`npm run --silent smoke:issue11 -- --signature <agent-name>`) plus the reusable request/response packet in `docs/BACKEND_API_EXAMPLE_PACKET.md`

Reference docs and planning notes are only useful if they map directly to runnable assertions and a stable local command path. PR #191, PR #204, issue #11, and issue #206 are the surviving follow-through threads because they keep that one `main` command reviewable across backend, frontend, QA, and planning.

### 3. Negative-scenario coverage

Closed beta needs confidence in failure handling, not just the green path.

Minimum scenarios to keep visible:

- reveal submitted without a valid prior commit
- signature-invalid or malformed onboarding/task payload path
- onboarding upload replay and payload-hash-mismatch rejection once the executable route from PR #204 lands
- proof verification returns `FAIL`
- award attempt blocked before prerequisite verification is complete

Expected output for each scenario must cite a stable error code or terminal status/result from the merged contract vocabulary. Use `npm run check:contract-drift` when a PR claims a route or proof-verification enum is already on `main`, and use the signed issue #11 evidence command when QA needs one paste-ready negative-path bundle instead of ad hoc PR comments.

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
- `docs/RUNTIME_EXECUTION_HANDOFF.md`
- current planning sweep queries plus runtime delivery threads (PR #133, PR #191, PR #204, PR #208, PR #211, issue #11, issue #205, and issue #206)

## Review Routine

Review these gates whenever one of the following happens:

- a Phase 1 contract/runtime PR merges, reopens, or is closed as superseded
- the onboarding upload queue changes state (PR #204 or issues #205/#206)
- a contract enum or error-code changes
- QA smoke/E2E execution scope changes
- epic #2 checklist changes

Closed issue references may stay in dated historical notes, but they should not be listed as active gate dependencies once the runnable evidence lane has moved to issue #11 and issue #206.

If a gate changes status, update the epic rollup and checkpoint board in the same review window.
