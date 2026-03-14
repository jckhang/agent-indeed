# Frontend MVP Surface and API Wiring Matrix

Last updated: 2026-03-14

Related issue: [#33](https://github.com/jckhang/agent-indeed/issues/33)

## Goal

Define the minimum manager, agent, and operator console surface needed to execute the closed-beta lifecycle:
`publish -> bid -> reveal -> verify -> award`.

## Closed-Beta Scope Boundaries

- Keep only the pages required for Phase 1 business validation.
- Prefer state clarity and failure handling over visual expansion.
- Exclude settlement, multi-tenant config, and design-system expansion.

## Persona Map

| Persona | Primary objective | Must-complete actions in MVP | Primary artifacts consumed |
| --- | --- | --- | --- |
| Manager | Publish a valid task and award with confidence | Create `TaskSpec`, inspect ranked candidates, award selected bid | Task constraints, ranking summary, proof result, award trace |
| Agent | Submit competitive bid and pass verification | Upload bundle, commit bid hash, reveal bid details + proof, read verify outcome | Task requirement snapshot, bid status, verification reason codes |
| Operator | Keep trust and audit flow actionable | Review verification failures/manual-review cases, inspect audit timeline | Proof verification outputs, audit events, trace hashes |

## MVP Page Map (Closed Beta Only)

### Manager Console

1. `/manager/tasks/new`
   - Create task with `TaskSpec` fields and bidding window checks.
2. `/manager/tasks/{taskId}/candidates`
   - View candidate list with hard-filter outcome and score breakdown.
3. `/manager/tasks/{taskId}/award`
   - Confirm winner and inspect award summary + decision trace.

### Agent Console

1. `/agent/onboarding`
   - Upload signed `AgentBundle` and handle schema/signature failures.
2. `/agent/tasks/{taskId}/commit`
   - Submit commit hash before commit deadline.
3. `/agent/tasks/{taskId}/reveal`
   - Reveal bid payload + `ProofPack` before reveal deadline.
4. `/agent/tasks/{taskId}/verification`
   - Observe verify result (`PASS`/`FAIL`/`MANUAL_REVIEW`) and reason codes.

### Operator Console

1. `/operator/proofs/queue`
   - Triage failed/manual-review verification items.
2. `/operator/proofs/{proofId}/review`
   - Re-run or override proof decisions with trace context.
3. `/operator/tasks/{taskId}/audit`
   - Inspect timeline from task creation to award.

## API-to-UI Wiring Matrix

### Manager pages

| Page | API endpoint | Required request fields from UI | Response fields required by UI | Contract status |
| --- | --- | --- | --- | --- |
| `/manager/tasks/new` | `POST /v1/tasks` | `idempotencyKey`, `task.title`, `task.description`, `task.budget.*`, `task.sla.*`, `task.constraints.*`, `task.risk.*`, `task.powmPolicy.*`, `task.biddingWindow.*` | `taskId`, `status`, `commitDeadline`, `revealDeadline` | Ready for core publish path; FE must include idempotency key and handle structured validation details when contract sync lands |
| `/manager/tasks/{taskId}/candidates` | `GET /v1/tasks/{taskId}/candidates` (proposed) | `taskId`, `topK`, `includeScoreBreakdown` | `agentId`, `identityTier`, `hardFilterPassed`, `rankingScore`, `scoreBreakdown`, `proofReadiness`, `decisionTraceHash` | Missing in current API |
| `/manager/tasks/{taskId}/award` | `POST /v1/tasks/{taskId}/award` + `GET /v1/tasks/{taskId}/award` (proposed) | `taskId`, `bidId`, `awardReason`, `idempotencyKey` | `taskId`, `awardedBidId`, `awardedAt`, `proofSummary`, `decisionTraceHash`, `auditEventId` | Missing in current API |

### Agent pages

| Page | API endpoint | Required request fields from UI | Response fields required by UI | Contract status |
| --- | --- | --- | --- | --- |
| `/agent/onboarding` | `POST /v1/agents/bundles` | `idempotencyKey`, `bundle.manifest.*`, `bundle.identity.*`, `bundle.skills[]`, `bundle.memoryRef.*`, `bundle.signature.*` | `agentId`, `version`, `status`, `result`, `indexedAt`; error `code`, `category`, `auditId`, `retryable`, `details`, `conflict` | Ready for create/replay/conflict/error paths in the current draft API; `bundle.schemaVersion` stays pending until the AgentBundle contract update in PR #31 lands |
| `/agent/tasks/{taskId}/commit` | `POST /v1/tasks/{taskId}/bids/commit` | `bid.bidId`, `bid.taskId`, `bid.agentId`, `bid.phase`, `bid.commit.bidHash`, `bid.commit.committedAt` | `bidId`, `taskId`, `agentId`, `phase`, `status` | Ready for write path, but no typed commit-window reason codes |
| `/agent/tasks/{taskId}/reveal` | `POST /v1/tasks/{taskId}/bids/reveal` | `bid.bidId`, `bid.taskId`, `bid.agentId`, `bid.phase`, `bid.reveal.nonce`, `bid.reveal.price.*`, `bid.reveal.executionPlan.*`, `bid.reveal.proof.*` | `bidId`, `phase`, `status`, `rankingScore`, `decisionTraceHash` | Ready for write path, but failure body is generic `ErrorResponse` |
| `/agent/tasks/{taskId}/verification` | `GET /v1/tasks/{taskId}/proofs/{proofId}` (proposed read endpoint) | `taskId`, `proofId` | `result`, `requiredDifficulty`, `achievedDifficulty`, `reasonCodes`, `verifiedAt` | Missing read endpoint; only `POST /v1/tasks/{taskId}/proofs/verify` exists |

### Operator pages

| Page | API endpoint | Required request fields from UI | Response fields required by UI | Contract status |
| --- | --- | --- | --- | --- |
| `/operator/proofs/queue` | `GET /v1/proofs` (proposed) | `result`, `updatedSince`, `cursor` | `proofId`, `taskId`, `agentId`, `result`, `reasonCodes`, `verifiedAt`, `needsManualReview` | Missing in current API |
| `/operator/proofs/{proofId}/review` | `POST /v1/tasks/{taskId}/proofs/verify` + `PATCH /v1/proofs/{proofId}/decision` (proposed override) | verify payload `proof.*`; override payload `decision`, `reason`, `operatorId` | `proofId`, `result`, `reasonCodes`, `verifiedAt`, `decisionTraceHash` | Partial: verify exists, manual override missing |
| `/operator/tasks/{taskId}/audit` | `GET /v1/tasks/{taskId}/events` (proposed) | `taskId`, `cursor`, `limit` | `eventType`, `eventId`, `actorRole`, `actorId`, `entityId`, `summary`, `traceHash`, `occurredAt` | Missing in current API |

## State-Driven UI Requirements

Minimum frontend state model to avoid race conditions and dead-end UX:

- Task authoring: `DRAFT -> SUBMITTING -> OPEN_FOR_MATCHING|OPEN_FOR_BIDDING -> AWARDED`.
- Bid lifecycle: `IDLE -> COMMITTING -> COMMITTED -> REVEALING -> REVEALED|REJECTED -> SCORED`.
- Verification lifecycle: `PENDING_VERIFY -> PASS|FAIL|MANUAL_REVIEW -> OVERRIDDEN` (operator path).
- Shared failure states: `VALIDATION_ERROR`, `WINDOW_CLOSED`, `IDEMPOTENT_REPLAY`, `CONFLICT`, `TIMEOUT_RETRYABLE`.

## Integration Risks and Missing Backend Fields

| Risk | Impact on frontend delivery | Minimal backend addition to unblock |
| --- | --- | --- |
| Missing candidate retrieval endpoint | Manager cannot inspect ranking before award | Add `GET /v1/tasks/{taskId}/candidates` with score breakdown |
| Missing award write/read endpoints | Closed loop cannot finish in UI | Add award APIs with `decisionTraceHash` and `auditEventId` |
| Missing list/read endpoints for bids/proofs | UI cannot refresh status without ad-hoc polling hacks | Add read endpoints for bid/proof status by `taskId`, `bidId`, `proofId` |
| Generic `ErrorResponse` for commit/reveal/verify failures | User-facing reason code mapping is unstable | Publish stable error code catalog with category + retryability |
| No idempotency support beyond bundle upload | Retry-safe UX cannot be guaranteed for task publish/award | Add idempotency key contract to task and award writes |
| No audit event query contract | Operator and manager cannot verify decisions without logs | Add task/bid event stream endpoint with pagination |

## Recommended Contract Follow-Ups

1. Add frontend-critical read APIs before Manager F1 and Agent F2 implementation starts.
2. Standardize error shape (`code`, `category`, `message`, `retryable`, `details`, `auditId`) across all write endpoints.
3. Freeze state enums for task, bid, proof, and award in `openapi.yaml` and `contracts.ts` to reduce UI branching drift.
