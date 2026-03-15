# Operator Audit Timeline Baseline (P1-23)

Last updated: 2026-03-14

## Objective

Define the first focused operator audit UI slice so an internal operator can:

1. inspect task and bid lifecycle events in strict chronological order,
2. understand proof, commit, reveal, and award failures without reading raw backend codes first, and
3. see when an audit record is incomplete enough to block stakeholder review.

This baseline keeps scope narrow: it covers `/operator/tasks/{taskId}/audit` as a read-heavy investigation surface and leaves queue triage or manual override flows to adjacent operator work.

## Scope

- Closed-beta operator workflow only.
- Task-level audit timeline and failure translation surface.
- Explicit handling for missing fields in audit/event payloads.

Out of scope:

- Manager award workflow or shortlist UI.
- Agent bid submission or proof authoring UX.
- Operator queue prioritization, reassignment, or override-write controls.

## Operator workflow

| Step | Goal | Primary UI surface | Current backend status |
| --- | --- | --- | --- |
| 1 | Open a task investigation thread | `Audit header` | Partial: task metadata exists in other flows, but no audit read endpoint exists yet |
| 2 | Follow lifecycle history | `Chronological event timeline` | Pending backend contract for `GET /v1/tasks/{taskId}/events` |
| 3 | Understand failure impact | `Failure translation panel` | Partial: stable reason/error codes exist in docs, but not all task/bid audit payloads are defined yet |
| 4 | Decide whether the record is review-ready | `Missing-field alert rail` | Pending backend event completeness guarantees |

## Information architecture

### 1. Audit header

Purpose:
- Establish investigation context before the operator scans the event list.

Header fields:
- `taskId`
- current task lifecycle state
- linked `bidId` / `proofId` when the investigation is scoped to a specific candidate
- latest `decisionTraceHash` when available
- timeline freshness indicator (`lastUpdatedAt` or equivalent event timestamp)

Missing-data handling:
- If task state, actor identity, or latest trace hash is missing, show an inline warning tag instead of silently omitting the value.

### 2. Chronological event timeline

Purpose:
- Render one ordered narrative from task creation through award or terminal failure.

Timeline requirements:
- Sort by canonical event timestamp ascending.
- Keep event names operator-friendly even when the backend event type is terse.
- Group repeated events by entity (`task`, `bid`, `proof`, `award`) but do not hide ordering.

Minimum event cards:
- `Task created`
- `Bid committed`
- `Bid revealed`
- `Proof verification completed`
- `Award decision recorded`
- terminal fallback events such as `Task closed without award`

Per-event fields:
- event title
- raw `eventType`
- `occurredAt`
- actor role/id
- affected entity id
- short summary sentence
- optional `traceHash` / `decisionTraceHash`

Missing-data handling:
- If `occurredAt`, actor, entity id, or summary is absent, show a visible `Missing audit field` callout on the card so the operator can treat the record as incomplete.

### 3. Failure translation panel

Purpose:
- Convert backend result codes into operator-ready explanations and next-step guidance.

Translation buckets:
- `Commit failed`
  - `BID_COMMIT_PAYLOAD_INVALID` -> malformed commit payload; agent correction required
  - `BID_COMMIT_TASK_MISMATCH` -> route/payload task mismatch; investigate client bug or tampering
  - `BID_COMMIT_WINDOW_CLOSED` -> commit arrived after the allowed window; no retry path
  - `BID_COMMIT_DUPLICATE` -> likely replay or idempotent resubmission; review timestamp and prior acceptance
- `Reveal failed`
  - `BID_REVEAL_COMMIT_NOT_FOUND` -> reveal has no valid prior commit
  - `BID_REVEAL_HASH_MISMATCH` -> reveal payload no longer matches committed hash
  - `BID_REVEAL_WINDOW_CLOSED` -> reveal arrived after deadline
- `Proof failed or paused`
  - `PROOF_VERIFY_PAYLOAD_INVALID` -> proof contents are incomplete or malformed
  - `PROOF_VERIFY_FAILED` -> proof does not satisfy policy
  - `PROOF_VERIFY_NEEDS_REVIEW` -> manual operator review remains required
- `Award blocked`
  - `TASK_AWARD_PRECONDITION_FAILED` -> award attempted before lifecycle prerequisites passed
  - `TASK_AWARD_PROOF_NOT_VERIFIED` -> candidate proof not in pass state
  - `TASK_AWARD_CANDIDATE_NOT_ELIGIBLE` -> candidate failed policy or shortlist gating
  - `AUDIT_QUERY_NOT_FOUND` -> audit trail or projection is incomplete

Rendering behavior:
- Lead with translated status text, not the raw code.
- Keep the raw code visible in secondary metadata for debugging.
- Attach retryability guidance from `docs/ERROR_CODE_RETRY_POLICY.md`.

### 4. Missing-field alert rail

Purpose:
- Prevent stakeholders from mistaking an incomplete audit record for a clean pass.

Alert conditions:
- missing event timestamp
- missing actor id/role
- missing entity id or correlation id
- missing trace hash for verification or award events
- missing human-readable summary on terminal failure events

Operator guidance:
- Show a persistent page-level warning when any blocking field is missing.
- Summarize which event cards are incomplete and why stakeholder review should pause.

## Failure-state copy model

| Raw backend signal | Operator-facing label | Guidance |
| --- | --- | --- |
| `BID_COMMIT_WINDOW_CLOSED` | Commit window expired | Treat as terminal unless a timeline bug or clock skew is proven. |
| `BID_REVEAL_HASH_MISMATCH` | Reveal does not match committed bid | Check for tampering, stale client state, or incorrect hashing flow. |
| `PROOF_VERIFY_FAILED` | Proof verification failed | Review reason codes and trace hash before escalating. |
| `PROOF_VERIFY_NEEDS_REVIEW` | Proof requires manual review | Keep task out of award-ready state until an operator decision is recorded. |
| `TASK_AWARD_PROOF_NOT_VERIFIED` | Award blocked by proof status | Resolve proof status before manager-facing award confirmation. |
| `AUDIT_QUERY_NOT_FOUND` | Audit trail incomplete | Escalate as a data/completeness issue; stakeholder review is blocked. |

## API to UI matrix

| UI surface | Contract/input | Current source | Status | Notes |
| --- | --- | --- | --- | --- |
| Audit header | task summary + latest trace metadata | Proposed `GET /v1/tasks/{taskId}/events` envelope metadata | Pending backend contract | Needs canonical last-event timestamp and current task state |
| Timeline event list | ordered audit event entries | Proposed `GET /v1/tasks/{taskId}/events` | Pending backend contract | Must preserve chronological ordering and include actor/entity metadata |
| Failure translation panel | stable error / reason codes + retryability | `docs/ERROR_CODE_RETRY_POLICY.md`, verifier result codes, award error codes | Partial | Code catalog exists, but event payloads still need stable projection fields |
| Missing-field alert rail | completeness flags derived from missing event fields | Proposed event payload completeness contract | Pending backend contract | UI should not guess completeness from absent optional fields alone |

## Backend dependency feedback for backlog

P1-23 keeps four concrete operator dependencies visible:

1. A task-scoped audit event query contract is still missing.
   - Suggested payload: ordered events with `eventId`, `eventType`, `occurredAt`, `actorRole`, `actorId`, `entityId`, `summary`, `traceHash`.
2. Verification and award events need explicit completeness guarantees.
   - The UI should know whether `decisionTraceHash`, actor metadata, and human-readable summaries are expected vs optional.
3. Failure translation depends on stable reason-code projection inside audit events.
   - Operators should not have to infer failure meaning only from generic error text.
4. Missing-field states must remain separate from business failures.
   - Incomplete audit data is a review blocker, not the same as a rejected bid or failed proof.

## Acceptance criteria mapping

| Acceptance criterion | Baseline coverage |
| --- | --- |
| Operator timeline renders task and bid audit events in chronological order with clear event names and timestamps. | Timeline section defines ordered event cards, operator-friendly labels, and required per-event timestamps. |
| Proof, commit, reveal, and award failures are translated into operator-friendly states instead of raw backend codes only. | Failure translation panel and copy model map stable backend codes to readable labels plus guidance. |
| Missing audit/event fields that block stakeholder review are highlighted explicitly in the UI. | Audit header, timeline cards, and alert rail define visible incomplete-record warnings instead of silent omissions. |
| Scope stays focused on operator audit visibility and does not expand into general admin-console work. | Scope and out-of-scope sections keep the slice limited to `/operator/tasks/{taskId}/audit` read behavior. |
