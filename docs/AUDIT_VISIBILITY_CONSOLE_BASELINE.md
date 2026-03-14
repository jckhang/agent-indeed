# Audit Visibility Console Baseline (P1-16)

Last updated: 2026-03-15

## Objective

Define the MVP audit-visibility slice so managers, operators, and reviewers can:

1. inspect task and bid history without reading raw logs,
2. understand why proof, commit, reveal, or award decisions failed, and
3. spot which missing backend fields still block trustworthy review.

This baseline stays aligned to the current repository reality: lifecycle state and observability expectations are documented, but audit-event query and award-read surfaces are still backend follow-through work.

## Scope

- Closed-beta audit and review workflow only.
- Read-only timeline, failure translation, and missing-field callouts.
- UI states for current documented lifecycle expectations plus explicit notes for missing backend read models.

Out of scope:

- Building the backend audit event store or query APIs.
- Manual decision override flows beyond the operator-facing dependency notes.
- Rich analytics or dashboard aggregation beyond one task/bid review slice.

## Audit workflow

| Step | Goal | Primary UI surface | Current backend status |
| --- | --- | --- | --- |
| 1 | Review chronological task + bid history | `Audit timeline` | Partial: event expectations exist in `docs/MVP_STATE_MODEL.md` and `docs/OBSERVABILITY_BASELINE.md`, but no `GET /v1/tasks/{taskId}/events` contract exists |
| 2 | Translate rejection and verification outcomes | `Failure reason panels` | Partial: stable proof/result codes are documented, but no task-scoped read model aggregates them for operator review |
| 3 | Decide whether evidence is complete enough for stakeholder review | `Missing-field alerts` | Pending: award trace, proof summary, and audit query surfaces still depend on backend issues `#10` and `#58` |

## Console information architecture

### 1. Audit timeline

Purpose:
- Render the lifecycle from task creation through award in one readable sequence for non-engineering reviewers.

Timeline sections:
- `Task created`: task id, actor, lifecycle state, initial risk/policy summary
- `Bid committed`: bid id, agent id, commit timestamp, window status, trace hash
- `Bid revealed`: reveal timestamp, price summary, execution-plan summary, proof id
- `Proof verified`: verification result, reason-code summary, policy trace reference, manual-review flag
- `Task awarded` or `Closed without award`: selected bid, award rationale summary, audit reference

Rendering rules:
- Order entries strictly by `occurredAt`.
- Group repeated event families by bid so reviewers can follow one candidate without scanning raw ids.
- Show both absolute timestamp and relative phase label (`commit`, `reveal`, `verify`, `award`) to reduce ambiguity in incident review.
- When an expected lifecycle event is absent, render a timeline gap card instead of silently skipping the step.

Current contract reality:
- `docs/MVP_STATE_MODEL.md` freezes the minimum event set: `TASK_CREATED`, `BID_COMMITTED`, `BID_REVEALED`, `POMW_VERIFIED`, `TASK_AWARDED`.
- `docs/OBSERVABILITY_BASELINE.md` already requires correlated `task_id`, `bid_id`, `proof_id`, `audit_id`, and `trace_id`.
- The current API draft does not yet expose a task-scoped audit timeline endpoint or a normalized event payload for UI consumption.

### 2. Failure reason panels

Purpose:
- Convert backend result codes and lifecycle failures into operator-friendly review states.

Panels:
- `Commit failure`: window closed, duplicate/conflict, route/payload mismatch
- `Reveal failure`: missing commit, hash mismatch, reveal window closed
- `Proof verification failure`: failed difficulty, payload invalid, manual review required
- `Award blockage`: no eligible candidate, verification incomplete, audit trace missing

Translation behavior:
- Lead with a plain-language status sentence, then show the stable code(s) underneath.
- Keep failure copy scoped to what the reviewer can conclude now; do not imply retryability when the shared error catalog marks a state terminal.
- When multiple codes exist, preserve backend ordering so audit replay matches backend evidence.

Failure-state mapping:

| Backend state or code | Audit console copy |
| --- | --- |
| `BID_COMMIT_WINDOW_CLOSED` | `Bid commit missed the commit window.` |
| `BID_REVEAL_COMMIT_NOT_FOUND` | `Reveal was rejected because no accepted commit exists.` |
| `BID_REVEAL_HASH_MISMATCH` | `Reveal payload does not match the committed bid hash.` |
| `PROOF_VERIFY_FAILED` | `Proof verification failed and the bid is no longer award-eligible.` |
| `PROOF_VERIFY_NEEDS_REVIEW` | `Automatic verification stopped at manual review.` |
| Task state not awardable | `Award is blocked until verification and audit evidence are complete.` |

Current contract reality:
- Proof-result codes and verification outputs are defined for write-time responses, but the repo does not yet define one read payload that joins commit/reveal/proof/award evidence for review.
- Commit and reveal negative-path mapping should stay synchronized with `docs/ERROR_CODE_RETRY_POLICY.md` rather than inventing UI-only labels.

### 3. Missing-field alerts

Purpose:
- Make incomplete backend data visible so reviewers know when evidence is absent, delayed, or still blocked on another issue.

Alert categories:
- `Missing audit event`: an expected lifecycle event is absent from the timeline
- `Missing actor context`: no reviewer-safe actor id/role is present
- `Missing proof summary`: proof result exists without difficulty or reason-code detail
- `Missing award trace`: selected winner exists without `decisionTraceHash` or `auditEventId`
- `Missing dependency contract`: data depends on unresolved backend issue `#10` or `#58`

Alert behavior:
- Inline alerts live beside the affected timeline card, not buried in a global warning area.
- Alerts should explain whether the data is truly missing, intentionally unavailable, or blocked on a backend contract follow-up.
- Missing-field states must remain reviewable and copy-complete even when the final interactive APIs are absent.

## API to UI matrix

| UI surface | Contract/input | Current source | Status | Notes |
| --- | --- | --- | --- | --- |
| Audit timeline list | task-scoped event stream | Proposed `GET /v1/tasks/{taskId}/events` | Pending backend contract | Needs event ordering, pagination, actor metadata, and lifecycle summaries |
| Timeline event detail | event payload with task/bid/proof linkage | Proposed audit read model | Pending backend contract | Must expose `taskId`, `bidId`, `proofId`, `auditId`, `traceHash`, `occurredAt`, and summary fields |
| Failure reason panels | stable code + reviewer-safe explanation | `docs/ERROR_CODE_RETRY_POLICY.md`, verify response draft | Partial | Codes exist, but read-time aggregation for task review is still missing |
| Award review summary | award state, winning bid, blockers, trace refs | Proposed award summary read model | Pending backend contract | Depends on issue `#58` for manager-facing award/read semantics |
| Missing-field alerts | null/missing contract fields plus dependency metadata | Proposed audit read model | Pending backend contract | UI must distinguish between intentionally absent fields and unresolved backend gaps |

## Backend dependency feedback for backlog

P1-16 uncovers four concrete contract gaps that should stay visible while audit work is planned:

1. A task-scoped audit event query surface is missing.
   - Suggested payload: paginated event list with `eventType`, `occurredAt`, `actorRole`, `actorId`, `taskId`, optional `bidId`, optional `proofId`, `auditId`, `traceHash`, and reviewer-safe summary text.
2. Failure reason aggregation is missing for read-time review.
   - Suggested payload: normalized failure block that joins commit/reveal/proof/award blockers without forcing the UI to infer state from raw write responses.
3. Award trace read fields remain incomplete.
   - Suggested payload: selected bid, task state, `decisionTraceHash`, `auditEventId`, proof summary, and unresolved blocker list.
4. Missing-field semantics need to be explicit in read contracts.
   - The UI must know whether a field is absent because it is pending ingestion, intentionally redacted, or not defined by the current backend scope.

These gaps should be treated as dependencies on issue `#10` and issue `#58`, not as frontend-only assumptions.

## Acceptance criteria mapping

| Acceptance criterion | Baseline coverage |
| --- | --- |
| Task and bid audit timelines are rendered in a readable sequence with clear event names and timestamps. | Audit timeline defines ordered lifecycle cards, required event families, gap handling, and reviewer-readable labels. |
| Proof, commit, reveal, and award failure reasons are translated into operator-friendly UI states. | Failure reason panels map stable backend states/codes into plain-language review copy and preserve code-level traceability. |
| UI explicitly highlights missing audit/event fields that block stakeholder review. | Missing-field alerts define inline callouts for absent event, actor, proof, and award-trace data. |
| The slice stays queue-ready until backend audit/query contracts are stable enough to integrate. | API matrix and backlog feedback call out the missing task event stream, failure aggregation, and award-read dependencies on `#10` and `#58`. |
