# Frontend MVP Surface and API Wiring Matrix

Last updated: 2026-03-14

## Objective

Define the minimum UI surface for closed beta and map each page to current backend contracts so frontend delivery can start without scope drift.

## Scope boundary (MVP only)

Included:
- Manager publishes task, reviews candidate signal, and confirms award outcome.
- Agent commits/reveals bid and views verification result.
- Operator inspects lifecycle events and failure reasons.

Excluded:
- Multi-tenant admin center.
- Settlement/payment UX.
- Design-system expansion beyond core workflow pages.

## 1) Persona map

| Persona | Primary goal | Success condition |
| --- | --- | --- |
| Manager | Publish tasks and choose trustworthy winner | Can complete publish -> award decision with trace visibility |
| Agent | Submit valid bid and proof on time | Can complete commit/reveal and see verification outcome |
| Operator | Diagnose workflow failures quickly | Can inspect task/bid/proof event timeline and rejection reasons |

## 2) MVP page map and navigation

### Manager console

1. `TaskCreatePage`
   - Input `TaskSpec` fields and bidding windows.
2. `TaskPublishResultPage`
   - Confirm task creation status and deadlines.
3. `CandidateDecisionPage`
   - Show candidate comparison and proof/verification summary.
4. `AwardResultPage`
   - Show final winner and decision trace hash.

### Agent console

1. `BidCommitPage`
   - Submit bid hash within commit window.
2. `BidRevealPage`
   - Submit reveal payload and `ProofPack` within reveal window.
3. `BidStatusTimelinePage`
   - Display commit/reveal/verify progression and rejection reasons.

### Operator console

1. `TaskAuditTimelinePage`
   - Inspect lifecycle events (`TASK_CREATED` -> `TASK_AWARDED`).
2. `FailureInspectionPage`
   - Filter failed reveal/proof cases by reason code.

### Navigation flow (closed beta)

Manager path:
`TaskCreatePage -> TaskPublishResultPage -> CandidateDecisionPage -> AwardResultPage`

Agent path:
`BidCommitPage -> BidRevealPage -> BidStatusTimelinePage`

Operator path:
`TaskAuditTimelinePage -> FailureInspectionPage`

## 3) API-to-UI wiring matrix

| Page | API endpoint | Required request fields | Required response fields | UI behavior |
| --- | --- | --- | --- | --- |
| `TaskCreatePage` | `POST /v1/tasks` | `task.title`, `task.description`, `task.budget`, `task.sla`, `task.constraints`, `task.risk`, `task.powmPolicy`, `task.biddingWindow` | `taskId`, `status`, `commitDeadline`, `revealDeadline` | Synchronous submit with inline schema validation |
| `TaskPublishResultPage` | `POST /v1/tasks` result reuse | none (from previous response) | `taskId`, `status`, deadlines | Read-only confirmation + copy task id |
| `CandidateDecisionPage` | (depends on candidate retrieval API from P1-04) | `taskId` | candidate list, ranking score breakdown, verification summary | Table + score explanation panel |
| `AwardResultPage` | (depends on award API/event query from P1-08) | `taskId`, selected winner id | winner id, score summary, `decisionTraceHash` | Final confirmation and trace visibility |
| `BidCommitPage` | `POST /v1/tasks/{taskId}/bids/commit` | `taskId`, `bid.bidId`, `bid.taskId`, `bid.agentId`, `bid.phase`, `bid.commit.bidHash`, `bid.commit.committedAt` | `bidId`, `phase`, `status` | Deadline countdown + commit confirmation |
| `BidRevealPage` | `POST /v1/tasks/{taskId}/bids/reveal` | `taskId`, `bid.bidId`, `bid.taskId`, `bid.agentId`, `bid.phase`, `bid.reveal`, `bid.reveal.proof` | `bidId`, `phase`, `status`, optional `rankingScore` | Hash match errors shown inline |
| `BidStatusTimelinePage` | reveal/verify response aggregation | `taskId`, `bidId` | bid status + proof verify result (`PASS/FAIL/MANUAL_REVIEW`) | Polling refresh (no event stream yet) |
| `TaskAuditTimelinePage` | (depends on audit query API from P1-08) | `taskId` | ordered lifecycle events, actor, timestamp, trace hash | Timeline visualization |
| `FailureInspectionPage` | (depends on audit/proof query API from P1-07/P1-08) | filters (`reasonCode`, `taskId`, `agentId`) | reason code, failed stage, payload refs | Search + filtered failure panel |

## 4) Data contract alignment notes

- Frontend should use `src/api/contracts.ts` types directly for form models where possible.
- `TaskSpec` and `Bid` payload assembly must be deterministic and hash-safe for commit/reveal.
- Error rendering should bind to stable error codes, not free-text messages.

## 5) Integration risks and missing backend fields

| Gap | Frontend impact | Follow-on issue |
| --- | --- | --- |
| No explicit candidate retrieval endpoint in current OpenAPI draft | `CandidateDecisionPage` cannot load ranking data | #6 |
| No explicit award command/query endpoint in current OpenAPI draft | `AwardResultPage` lacks authoritative data source | #10 |
| No query API for bid/proof timeline snapshots | `BidStatusTimelinePage` must over-rely on local state | #7, #9 |
| No audit timeline query endpoint defined | Operator pages cannot be implemented end-to-end | #10 |
| Commit/reveal/proof error code catalog not fully frozen | UI cannot implement deterministic failure messaging | #7, #9 |

## 6) MVP FE implementation sequence

1. Build `TaskCreatePage` + `TaskPublishResultPage` against `POST /v1/tasks`.
2. Build `BidCommitPage` + `BidRevealPage` against existing bidding endpoints.
3. Add temporary polling-based `BidStatusTimelinePage`.
4. Add operator/award views once P1-07 and P1-08 query contracts are frozen.
