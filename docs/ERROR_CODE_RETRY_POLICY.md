# MVP Error Code Catalog and Retry/Idempotency Policy

Last updated: 2026-03-14

## Purpose

Define one stable failure contract for MVP integrations so frontend, backend, and QA can make deterministic decisions on retries, user messaging, and audit lookup.

## Shared error response baseline

All MVP error responses should follow this shape:

- `code`: stable machine-readable code (never parse free-text messages)
- `category`: high-level failure class for UX and alert routing
- `message`: human-readable summary
- `auditId`: trace key for incident lookup
- `retryable`: whether client should retry the same operation
- `retryAfterSeconds` (optional): server-directed retry delay
- `details` (optional): structured context (`fieldPath`, `rule`, etc.)

## Error code catalog

| Stage | Code | Category | Typical trigger | Client handling |
| --- | --- | --- | --- | --- |
| Upload bundle | `AGENT_BUNDLE_SCHEMA_INVALID` | `SCHEMA` | Missing/invalid required fields | Fix payload; do not retry unchanged payload |
| Upload bundle | `AGENT_BUNDLE_SCHEMA_UNSUPPORTED_VERSION` | `SCHEMA` | Unsupported schema version | Upgrade client schema; retry after payload upgrade |
| Upload bundle | `AGENT_BUNDLE_SIGNATURE_INVALID` | `SIGNATURE` | Signature verification failed | Re-sign bundle and retry with new payload |
| Upload bundle | `AGENT_BUNDLE_SIGNATURE_SIGNER_MISMATCH` | `SIGNATURE` | `signerDid` does not match identity | Fix identity/signature binding; no blind retry |
| Upload bundle | `AGENT_BUNDLE_SIGNATURE_PAYLOAD_MISMATCH` | `SIGNATURE` | Signature payload hash mismatch | Recompute payload hash and re-sign |
| Upload bundle | `AGENT_BUNDLE_VERSION_CONFLICT` | `VERSION` | Same `(agentId, version)` with different payload hash | Bump version or reconcile payload; no immediate retry |
| Publish task | `TASK_SPEC_CONSTRAINTS_MISSING` | `VALIDATION` | Required `TaskSpec` fields missing/invalid | Fix request fields; do not retry unchanged payload |
| Publish task | `TASK_SPEC_POLICY_INVALID` | `POLICY` | Incompatible risk/policy combination | Adjust policy values and retry |
| Publish task | `TASK_CREATE_IDEMPOTENCY_CONFLICT` | `IDEMPOTENCY` | Reused idempotency identity with mismatched payload | Generate new idempotency identity or replay exact payload |
| Commit bid | `BID_COMMIT_PAYLOAD_INVALID` | `VALIDATION` | Missing required `Bid` commit fields | Fix request and retry |
| Commit bid | `BID_COMMIT_TASK_MISMATCH` | `VALIDATION` | Path `taskId` and `bid.taskId` mismatch | Correct request identifiers and retry |
| Commit bid | `BID_COMMIT_WINDOW_CLOSED` | `WINDOW` | Commit after commit deadline | Do not retry; workflow state has advanced |
| Commit bid | `BID_COMMIT_DUPLICATE` | `IDEMPOTENCY` | Duplicate commit for same bid/idempotency key | Treat as already-submitted unless payload differs; reuse returned window snapshot |
| Reveal bid | `BID_REVEAL_PAYLOAD_INVALID` | `VALIDATION` | Missing nonce/price/execution plan/proof fields | Fix request and retry |
| Reveal bid | `BID_REVEAL_COMMIT_NOT_FOUND` | `PRECONDITION` | No valid commit exists for reveal | Do not retry until commit exists |
| Reveal bid | `BID_REVEAL_HASH_MISMATCH` | `PRECONDITION` | Reveal content does not match committed hash | Correct reveal payload using `expectedBidHash`; no blind retry |
| Reveal bid | `BID_REVEAL_WINDOW_CLOSED` | `WINDOW` | Reveal after reveal deadline | Do not retry; submit is permanently rejected |
| Verify proof | `PROOF_VERIFY_PAYLOAD_INVALID` | `VALIDATION` | Invalid or incomplete `ProofPack` | Fix proof payload and retry |
| Verify proof | `PROOF_VERIFY_POLICY_INVALID` | `POLICY` | Policy input incompatible with task/identity tier | Correct policy inputs and retry |
| Verify proof | `PROOF_VERIFY_FAILED` | `VERIFICATION` | Proof does not satisfy required difficulty | Do not blind retry; improve proof first |
| Verify proof | `PROOF_VERIFY_NEEDS_REVIEW` | `VERIFICATION` | Automated verification cannot make final decision | Route to manual review; no automatic retry loop |
| Query bid/proof status | `BID_STATUS_NOT_FOUND` | `AUDIT` | Requested bid status record does not exist | Retry once for eventual consistency, then show not-found state |
| Query bid/proof status | `PROOF_STATUS_NOT_FOUND` | `AUDIT` | Requested proof status record does not exist | Retry once for eventual consistency, then show not-found state |
| Award/audit | `TASK_AWARD_PRECONDITION_FAILED` | `PRECONDITION` | Award attempted before verify-ready state | Retry only after lifecycle preconditions pass |
| Award/audit | `TASK_AWARD_PROOF_NOT_VERIFIED` | `PRECONDITION` | Candidate proof not in pass state | Do not retry without proof status change |
| Award/audit | `TASK_AWARD_CANDIDATE_NOT_ELIGIBLE` | `POLICY` | Candidate fails hard filters/policy gate | Pick another candidate or update constraints |
| Award/audit | `AUDIT_QUERY_NOT_FOUND` | `AUDIT` | Task/bid trace record missing | Retry once for eventual consistency, then escalate |

## Retry and idempotency rules by operation

| Operation | Idempotency identity | Safe retry guidance |
| --- | --- | --- |
| `POST /v1/agents/bundles` | `idempotencyKey` + payload hash | If network/5xx timeout, retry with the same `idempotencyKey` and exact payload |
| `POST /v1/tasks` | deterministic request identity (planned: dedicated idempotency key) | Retry only when `retryable=true`; otherwise correct payload first |
| `POST /v1/tasks/{taskId}/bids/commit` | `bid.bidId` + `bid.bidHash` | Retry same payload on transient failures; treat duplicate commit as already submitted |
| `POST /v1/tasks/{taskId}/bids/reveal` | `bid.bidId` + reveal nonce/hash | Retry only for transport failures; never mutate reveal payload under same `bidId` |
| `POST /v1/tasks/{taskId}/proofs/verify` | `proof.proofId` + proof digest | Retry only when server indicates `retryable=true` |
| Award command/query (P1-08 scope) | `taskId` + selected `bidId` | Retry reads for eventual consistency; writes require lifecycle precondition checks |

## Canonical source mapping

- OpenAPI draft: `src/api/openapi.yaml` (`ErrorCode`, `ErrorCategory`, `ErrorResponse`)
- TypeScript contract draft: `src/api/contracts.ts` (`ApiErrorCode`, `ApiErrorCategory`, `ApiErrorResponse`)
- OpenSpec scenarios:
  - `openspec/changes/agent-dispatch-platform/specs/agent-onboarding-sync/spec.md`
  - `openspec/changes/agent-dispatch-platform/specs/task-marketplace-bidding-powm/spec.md`

## Implementation notes

- UI and API clients should branch on `code` and `retryable`, not on message text.
- New error codes must be added to OpenAPI, contracts, and this document in the same PR.
- If an operation is not yet implemented, keep codes reserved but documented to avoid naming drift.
