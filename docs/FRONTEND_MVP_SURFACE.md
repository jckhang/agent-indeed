# Frontend MVP Surface and API Wiring Matrix

Last updated: 2026-03-15

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
   - View candidate list with hard-filter outcome, score breakdown, and fallback states; see `docs/MANAGER_SHORTLIST_REVIEW_AWARD_READINESS_UI_SLICE.md`.
3. `/manager/tasks/{taskId}/award`
   - Inspect award-readiness blockers and winner summary inside the same manager review slice.

### Agent Console

1. `/agent/onboarding`
   - Upload signed `AgentBundle` and handle schema/signature failures.
2. `/agent/tasks/{taskId}/bid-workspace`
   - Prepare commit, reveal bid payload, and complete `ProofPack` entry from one workflow.
3. `/agent/tasks/{taskId}/verification`
   - Observe verify result (`PASS`/`FAIL`/`MANUAL_REVIEW`) and reason codes after reveal handoff.

### Operator Console

1. `/operator/proofs/queue`
   - Triage failed/manual-review verification items.
2. `/operator/proofs/{proofId}/review`
   - Re-run or override proof decisions with trace context.
3. `/operator/tasks/{taskId}/audit`
   - Inspect timeline from task creation to award.
   - Baseline behavior and dependency notes live in `docs/AUDIT_VISIBILITY_CONSOLE_BASELINE.md`.
   - Translate lifecycle failures into operator-friendly states and flag incomplete audit records.

## API-to-UI Wiring Matrix

### Manager pages

| Page | API endpoint | Required request fields from UI | Response fields required by UI | Contract status |
| --- | --- | --- | --- | --- |
| `/manager/tasks/new` | `POST /v1/tasks` | `task.title`, `task.description`, `task.budget.*`, `task.sla.*`, `task.constraints.*`, `task.risk.*`, `task.powmPolicy.*`, `task.biddingWindow.*` | `taskId`, `status`, `commitDeadline`, `revealDeadline` | Ready for a publish-only slice; explicit task-create idempotency is still a follow-up and should not be invented in UI |
| `/manager/tasks/{taskId}/candidates` | `GET /v1/tasks/{taskId}/candidates` (proposed) | `taskId`, `topK`, `includeScoreBreakdown` | `agentId`, `identityTier`, `hardFilterPassed`, `rankingScore`, `scoreBreakdown`, `proofReadiness`, `decisionTraceHash` | Missing in current API |
| `/manager/tasks/{taskId}/award` | `POST /v1/tasks/{taskId}/award` + `GET /v1/tasks/{taskId}/award` (proposed) | `taskId`, `bidId`, `awardReason`, `idempotencyKey` | `taskId`, `awardedBidId`, `awardedAt`, `proofSummary`, `decisionTraceHash`, `auditEventId` | Missing in current API |

### Agent pages

| Page | API endpoint | Required request fields from UI | Response fields required by UI | Contract status |
| --- | --- | --- | --- | --- |
| `/agent/onboarding` | `POST /v1/agents/bundles` | `idempotencyKey`, `bundle.manifest.*`, `bundle.identity.*`, `bundle.skills[]`, `bundle.memoryRef.*`, `bundle.signature.*` | `agentId`, `version`, `status`, `result`, `indexedAt`; error `code`, `category`, `auditId`, `retryable`, `details`, `conflict` | Ready for create/replay/conflict/error paths in the current draft API; `bundle.schemaVersion` stays pending until the AgentBundle contract update in PR #31 lands |
| `/agent/tasks/{taskId}/bid-workspace` (commit stage) | `POST /v1/tasks/{taskId}/bids/commit` | `idempotencyKey`, `commit.bidId`, `commit.taskId`, `commit.agentId`, `commit.bidHash`, `commit.committedAt` | `bidId`, `taskId`, `agentId`, `phase`, `status`, `result`, `window.*` | Ready for the commit stage of the unified workspace; stable reason codes and server-authored window snapshot already exist |
| `/agent/tasks/{taskId}/bid-workspace` (reveal stage) | `POST /v1/tasks/{taskId}/bids/reveal` | `idempotencyKey`, `reveal.bidId`, `reveal.taskId`, `reveal.agentId`, `reveal.nonce`, `reveal.price.*`, `reveal.executionPlan.*`, `reveal.proof.*` | `bidId`, `phase`, `status`, `result`, `rankingScore`, `decisionTraceHash`, `proofSubmission.*`, `window.*` | Ready for the reveal stage; proof read endpoint is still needed to recover after refresh |
| `/agent/tasks/{taskId}/verification` | `GET /v1/tasks/{taskId}/proofs/{proofId}` (proposed read endpoint) | `taskId`, `proofId` | `result`, `requiredDifficulty`, `achievedDifficulty`, `reasonCodes`, `verifiedAt` | Missing read endpoint; bid workspace can hand off here after reveal, but durable refresh still depends on issue #59 |

### Operator pages

| Page | API endpoint | Required request fields from UI | Response fields required by UI | Contract status |
| --- | --- | --- | --- | --- |
| `/operator/proofs/queue` | `GET /v1/proofs` (proposed) | `result`, `updatedSince`, `cursor` | `proofId`, `taskId`, `agentId`, `result`, `reasonCodes`, `verifiedAt`, `needsManualReview` | Missing in current API |
| `/operator/proofs/{proofId}/review` | `POST /v1/tasks/{taskId}/proofs/verify` + `PATCH /v1/proofs/{proofId}/decision` (proposed override) | verify payload `proof.*`; override payload `decision`, `reason`, `operatorId` | `proofId`, `result`, `reasonCodes`, `verifiedAt`, `decisionTraceHash`; error `code`, `category`, `retryable`, `details.policyTraceId` | Partial: verify now has typed proof failure codes, manual override still missing |
| `/operator/tasks/{taskId}/audit` | `GET /v1/tasks/{taskId}/events` (proposed) | `taskId`, `cursor`, `limit` | `eventType`, `eventId`, `actorRole`, `actorId`, `entityId`, `summary`, `traceHash`, `occurredAt`, completeness flags or equivalent missing-field signal | Missing in current API |

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
| Missing list/read endpoints for bids/proofs after write success | UI cannot refresh long-running verification without ad-hoc polling hacks | Add read endpoints for bid/proof status by `taskId`, `bidId`, `proofId` |
| No idempotency support beyond bundle upload | Retry-safe UX cannot be guaranteed for task publish/award | Add idempotency key contract to task and award writes |
| No audit event query contract | Operator and manager cannot verify decisions without logs | Add task/bid event stream endpoint with pagination |
| No audit-field completeness contract | Operator cannot distinguish incomplete records from clean lifecycle history | Add required-vs-optional event fields or explicit completeness markers |

Detailed post-merge frontend dependency tracking now lives in `docs/FRONTEND_POST_MERGE_DATA_GAP_LEDGER.md`, which compares the merged manager/agent UI slices with the still-open contract PRs.

## Recommended Contract Follow-Ups

1. Add frontend-critical read APIs before Manager F1 and Agent F2 implementation starts.
2. Standardize error shape (`code`, `category`, `message`, `retryable`, `details`, `auditId`) across all write endpoints.
3. Add task-scoped bid/proof read endpoints that reuse the existing `window` snapshot shape so the unified bid workspace can recover state after refresh.
4. Freeze state enums for task, bid, proof, and award in `openapi.yaml` and `contracts.ts` to reduce UI branching drift.
5. Keep `docs/FRONTEND_POST_MERGE_DATA_GAP_LEDGER.md` aligned with PRs #68, #73, and #83 so merged UI docs do not drift from the next contract round.
