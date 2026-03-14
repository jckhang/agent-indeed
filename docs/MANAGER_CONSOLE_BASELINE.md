# Manager Console Baseline (P1-14)

Last updated: 2026-03-14

## Objective

Define the first manager-facing MVP console slice so a manager can:

1. publish a task from the current `TaskSpec` contract,
2. inspect candidate ranking output without reading raw API payloads, and
3. understand award readiness and decision state before the award API is finalized.

This baseline stays aligned to the current repository reality: the task-create contract exists today, while candidate-read and award-read/write surfaces still need backend follow-through.

## Scope

- Closed-beta manager workflow only.
- Task authoring, candidate review, and award summary/readiness states.
- UI states for current contracts plus explicit notes for missing backend surfaces.

Out of scope:

- Rich visual design system work.
- Agent commit/reveal UI.
- Operator audit timeline UI.

## Manager workflow

| Step | Goal | Primary UI surface | Current backend status |
| --- | --- | --- | --- |
| 1 | Create task | `Task composer` | Ready now via `POST /v1/tasks` |
| 2 | Inspect ranking | `Candidate review panel` | Partial: scoring fields exist on `BidResponse`, but no manager query endpoint exists |
| 3 | Review award readiness | `Award summary drawer` | Partial: state/error baselines exist, but no award summary or award command endpoint exists |

## Console information architecture

### 1. Task composer

Purpose:
- Let a manager submit one MVP task without hand-writing JSON.

Sections:
- `Task brief`: `title`, `description`
- `Budget and settlement`: `budget.currency`, `budget.minAmount`, `budget.maxAmount`, optional `settlementModel`
- `SLA`: `sla.deadlineAt`, `sla.maxLatencyMs`, optional `sla.minSuccessRate`
- `Candidate constraints`: `constraints.identityTierMin`, `constraints.requiredSkills`, optional `preferredSkills`, optional `complianceTags`
- `Risk and policy`: `risk.level`, `risk.valueScore`, optional `risk.abuseSensitivity`, `powmPolicy.mode`, `powmPolicy.baseDifficulty`, optional `challengeType`, optional `stakeMinAmount`
- `Bidding window`: `biddingWindow.commitDeadline`, `biddingWindow.revealDeadline`
- `Submission guard`: generated `idempotencyKey` shown as advanced metadata so retries are explainable

Validation behavior:
- Required fields mirror `TaskSpec` and `CreateTaskRequest`.
- Date ordering must enforce `commitDeadline < revealDeadline`.
- Budget must enforce `minAmount <= maxAmount`.
- When `powmPolicy.mode=MANUAL`, the UI must require the manager to review difficulty/challenge settings before submit.

Success state:
- Show returned `taskId`, initial task state, and next action guidance: "Review candidate ranking when marketplace scoring is available."

Failure state:
- Branch on stable codes from `docs/ERROR_CODE_RETRY_POLICY.md`.
- Inline focus:
  - `TASK_SPEC_CONSTRAINTS_MISSING`: field-level correction state
  - `TASK_SPEC_POLICY_INVALID`: risk/policy mismatch explanation
  - `TASK_CREATE_IDEMPOTENCY_CONFLICT`: replay guidance and request regeneration path

### 2. Candidate review panel

Purpose:
- Translate ranking/scoring output into a manager-readable shortlist view.

Panel layout:
- Summary strip: task id, current state, number of candidates, ranking freshness timestamp
- Candidate table:
  - rank
  - agent id
  - identity tier
  - hard-filter result
  - total ranking score
  - score breakdown chips (`success`, `latency`, `budget`, `similarity`)
  - proof status
  - warnings/missing data
- Side panel:
  - selected candidate decision trace hash
  - reveal status
  - proof outcome
  - explanation of why award is blocked or allowed

Missing-field handling:
- If score breakdown is incomplete, show `Pending backend score breakdown` instead of hiding the row.
- If proof verification is not finished, show `Awaiting verification` and disable any award CTA.
- If no candidates pass hard filters, render an explicit empty state with the blocking constraint summary.

Current contract reality:
- `BidResponse` already exposes `rankingScore` and `decisionTraceHash`.
- The current API draft does not yet expose:
  - a manager query endpoint to list ranked candidates by `taskId`
  - hard-filter pass/fail explanation fields
  - score breakdown dimensions
  - verification status aggregated into a manager read model

### 3. Award summary drawer

Purpose:
- Give the manager one place to understand whether the task is awardable and what evidence supports the decision.

Sections:
- `Task state`: `OPEN_FOR_MATCHING`, `OPEN_FOR_BIDDING`, `VERIFYING`, `AWARDED`, `CLOSED_NO_AWARD`
- `Recommended candidate`: top-ranked candidate id, ranking score, proof status, decision trace hash
- `Award readiness`: ready, blocked, or already awarded
- `Blocking reasons`: map lifecycle and proof preconditions into manager-readable copy
- `Audit callouts`: note that final award must persist decision trace and audit events

Blocking-state mapping:

| Backend condition | Manager copy |
| --- | --- |
| Task still in `OPEN_FOR_MATCHING` or `OPEN_FOR_BIDDING` | `Award is unavailable until bidding and verification finish.` |
| Candidate proof not terminal | `Proof verification is still running.` |
| Candidate proof failed | `Top candidate is not award-eligible; review the next valid candidate.` |
| No eligible candidates | `No awardable candidate is available yet.` |
| Task already awarded | `Award is complete; use audit view for trace details.` |

Current contract reality:
- State and error baselines exist in `docs/MVP_STATE_MODEL.md` and `docs/ERROR_CODE_RETRY_POLICY.md`.
- No award summary query or award command is present in `src/api/openapi.yaml` yet.

## API to UI matrix

| UI surface | Contract/input | Current source | Status | Notes |
| --- | --- | --- | --- | --- |
| Task composer submit | `CreateTaskRequest` (`idempotencyKey`, `task`) | `POST /v1/tasks` | Ready | Can ship immediately against current draft |
| Task composer result | `CreateTaskResponse` | `POST /v1/tasks` response | Ready | Needs frontend confirmation banner with `taskId` + state |
| Candidate review table | ranked candidate collection | Proposed manager read model | Pending backend contract | Needs task-scoped query plus score breakdown fields |
| Candidate detail side panel | decision trace + proof status | Proposed manager read model | Pending backend contract | Can reuse `decisionTraceHash`, but needs richer score/proof fields |
| Award summary drawer | task state + selected winner + award blockers | Proposed award summary read model | Pending backend contract | Must align with P1-08 audit/award work |
| Award action CTA | selected `bidId` + idempotency key | Proposed award command | Pending backend contract | Needs command endpoint and precondition errors |

## Backend dependency feedback for backlog

P1-14 uncovers three concrete API gaps that should stay visible during backend planning:

1. A manager candidate-read surface is missing.
   - Suggested payload: ordered candidates with hard-filter outcome, score breakdown, proof status, and `decisionTraceHash`.
2. A manager award-summary read model is missing.
   - Suggested payload: task state, selected winner, blockers, proof summary, and audit trace references.
3. An explicit award command contract is missing.
   - Suggested command shape: `taskId`, `selectedBidId`, `idempotencyKey`, optional manager rationale.

These gaps should be treated as dependencies on the existing matching/audit work rather than separate ad hoc UI-only contracts.

## Acceptance criteria mapping

| Acceptance criterion | Baseline coverage |
| --- | --- |
| Manager can create an MVP task from UI using the current `TaskSpec` contract. | Task composer maps every `TaskSpec` section plus request idempotency handling to the current `POST /v1/tasks` contract. |
| Candidate/ranking output is rendered with score breakdown and missing-field handling. | Candidate review panel defines score breakdown slots, empty/error/loading states, and explicit fallback copy for missing backend fields. |
| Award decision summary is visible with clear state/status messaging and backend dependency callouts. | Award summary drawer maps manager-facing states and blockers to the MVP state model and calls out missing award contracts. |
| Any API contract gaps found during UI planning are fed back into the backlog with explicit notes. | This document records missing read/write surfaces and `docs/issues/PHASE1_ISSUES.md` links them as tracked follow-up notes for P1-14. |
