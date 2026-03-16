# Phase 1 Beta Readiness Gates

Last updated: 2026-03-16

This document turns epic #2 (`[Phase 1 Epic] Agent Dispatch Foundation MVP`) into a small set of
reviewable release gates for closed-beta readiness. It complements:

- `docs/PHASE1_GOALS.md` for the MVP definition of done
- `docs/ROADMAP.md` for phase checkpoints and milestone dates
- `docs/PHASE1_EPIC_STATUS.md` for the current issue/PR rollup

## Gate Summary

| Gate | Status | Ready when | Active dependencies | Evidence to collect |
| --- | --- | --- | --- | --- |
| Contract convergence | In progress | The remaining backend contract PRs are merged and the shared enum/error vocabulary is stable across OpenSpec, OpenAPI, and TypeScript contracts. | PR #55, PR #66, PR #68, PR #83, PR #90, PR #92 | `openspec validate --all`, contract diff review, synced `src/api/openapi.yaml` + `src/api/contracts.ts` |
| Happy-path execution | Blocked | The team can trace one publish -> match -> commit -> reveal -> verify -> award flow without relying on undocumented fields or manual interpretation. | Issue #11, PR #84, PR #95, PR #96, plus the contract gate above | QA smoke checklist, API examples, merged frontend data-gap notes |
| Negative-scenario coverage | Blocked | QA can exercise no-commit-reveal, signature-invalid, proof-fail, and manual-review/award-block paths with stable expected outcomes. | Issue #11, PR #83, PR #92, `docs/ERROR_CODE_RETRY_POLICY.md`, `docs/CLOSED_BETA_SECURITY_READINESS.md` | Smoke/E2E assertions, expected error/result matrix, rollback notes |
| Audit evidence trail | In progress | Audit outputs show key lifecycle transitions plus enough proof/award context for operator review and beta sign-off. | Issue #10, PR #92, `docs/MVP_TELEMETRY_HANDOFF.md`, `docs/OBSERVABILITY_BASELINE.md` | Audit event names, award trace fields, telemetry handoff checklist |
| Planning + handoff hygiene | In progress | The planning docs, epic rollup, smoke matrix, and QA handoff docs all describe the same open blockers and merged work. | PR #82, PR #84, PR #95, PR #96, PR #97 | `docs/PHASE1_CHECKPOINT_BOARD.md`, `docs/PHASE1_EPIC_STATUS.md`, QA handoff docs stay in sync |

## Gate Details

### 1. Contract convergence

This is the main prerequisite for every downstream QA or audit activity.

- Matching still depends on PR #55.
- Verification status durability still depends on PR #66.
- Manager shortlist/award reads still depend on PR #68.
- Verifier terminal vocabulary and reason-code behavior still depend on PR #83.
- Onboarding kickoff examples still depend on PR #90.
- Audit-event and award-trace surface still depends on PR #92.

Release note: if any of these contracts change enum names, required fields, or error-code wording,
the same update must land in OpenSpec plus both API drafts before the gate can be marked ready.

### 2. Happy-path execution

The beta happy path is not just one demo; it needs one repeatable handoff pack:

- QA smoke matrix in PR #84
- frontend data-gap notes in PR #95
- API example outline in PR #96
- final executable E2E issue #11 after the contract gates settle

The gate is ready only when a reviewer can follow one single source bundle from docs to API examples
to smoke assertions without guessing missing fields.

### 3. Negative-scenario coverage

Closed beta needs confidence in failure handling, not just the green path.

Minimum scenarios to keep visible:

- reveal submitted without a valid prior commit
- signature-invalid or malformed onboarding/task payload path
- proof verification returns `FAIL`
- proof verification returns `MANUAL_REVIEW`
- award attempt blocked before prerequisite verification is complete

The expected output for each scenario should cite either a stable error code or a stable terminal
status/result so QA is not validating prose-only behavior.

### 4. Audit evidence trail

Audit readiness is the clearest remaining M4 blocker after contract convergence.

The beta review pack should be able to answer:

- what happened
- when it happened
- which task, bid, proof, and candidate were involved
- why the award decision was allowed or blocked

That evidence should come from the shared audit/telemetry surfaces, not from ad hoc reviewer notes.

### 5. Planning + handoff hygiene

This gate stays green only when the planning layer remains current after merges.

At minimum, these docs must agree on which threads are still open:

- `docs/PHASE1_CHECKPOINT_BOARD.md`
- `docs/PHASE1_EPIC_STATUS.md`
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- the active QA handoff docs attached to issue #11 follow-through

## Review Routine

Review these gates whenever one of the following happens:

- a Phase 1 PR merges or reopens
- a contract enum or error-code changes
- QA smoke scope changes
- the epic #2 checklist changes

If a gate changes status, update the epic rollup and the checkpoint board in the same review window.
