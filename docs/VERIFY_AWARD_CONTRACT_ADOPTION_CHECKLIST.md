# Verify/Award Contract Adoption Checklist

Last updated: 2026-03-20

This checklist translates the currently published verify, proof-status, award, and
 audit-trace vocabulary from `src/api/openapi.yaml` and `src/api/contracts.ts`
 into one handoff note for the remaining runtime, QA, and beta-readiness follow-through.

Use this document when deciding whether a verify/award behavior is already
 contract-frozen on `main`, belongs in the live issue #11 evidence lane, or still
 needs a new downstream issue instead of a local alias.

## Source of truth

- `POST /v1/tasks/{taskId}/proofs/verify` request/response: `src/api/openapi.yaml`, `src/api/contracts.ts`
- proof and bid refresh reads: `GET /v1/tasks/{taskId}/proofs/{proofId}` and `GET /v1/tasks/{taskId}/bids/{bidId}`
- award write + award/audit trace fields: `POST /v1/tasks/{taskId}/award`, `TaskAwardedAuditPayload`, and `AwardDecisionDetail`
- live executable evidence handoff: issue #11 plus `docs/RUNTIME_EXECUTION_HANDOFF.md`
- dated contract drift baseline only: `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md`

## 1. Verify requests must reuse the published proof payload exactly

### Verify request envelope

`POST /v1/tasks/{taskId}/proofs/verify` requires:

- path field: `taskId`
- body fields:
  - `policyTraceId`
  - `proof`

`policyTraceId` must replay an already persisted policy snapshot from
 `POST /v1/tasks/{taskId}/proof-policy`; verify handlers should not silently recompute a new policy snapshot.

### Proof payload fields already frozen on `main`

`proof` must preserve the current `ProofPack` shape:

- identity + linkage
  - `proofSchemaVersion`
  - `proofId`
  - `taskId`
  - `agentId`
  - `capturedAt`
- identity evidence
  - `identityProof.credentialLevel`
  - `identityProof.signerDid`
  - `identityProof.signature`
- work sample
  - `sampleWork.sampleTaskDigest`
  - `sampleWork.outputDigest`
  - optional: `sampleWork.qualityScore`, `sampleWork.runtimeMs`
- execution trace
  - `executionTrace.traceHash`
  - `executionTrace.traceUri`
  - `executionTrace.traceSignature`
  - optional: `executionTrace.toolCallCount`
- optional anti-sybil section
  - `antiSybil.challengeType`
  - `antiSybil.challengeInput`
  - `antiSybil.challengeOutput`
  - `antiSybil.stakeAmount`
  - `antiSybil.stakeAsset`

## 2. Verify responses and award carry-over fields are frozen now

### Terminal verify response

The current `ProofVerificationResponse` shape is:

| Field | Why it must stay aligned |
| --- | --- |
| `proofId` | Stable proof record key for read-side recovery and audit joins. |
| `result` | Frozen terminal vocabulary: `PASS`, `FAIL`, `MANUAL_REVIEW`. |
| `policyTraceId` | Keeps verify, audit, and award tied to the same policy snapshot. |
| `requiredPolicy` | Preserves the resolved policy decision for replay/debug. |
| `requiredDifficulty` | Explains the threshold that gated the decision. |
| `achievedDifficulty` | Explains the actual proof strength observed. |
| `decisionTraceHash` | Canonical digest carried into audit and award evidence. |
| `reasonCodes[]` | Stable machine-readable explanation list from `ProofVerificationReasonCode`. |
| `verifiedAt` | Terminal timestamp for refresh and audit review. |

### Published reason-code enum

`ProofVerificationReasonCode` is already frozen on `main` with these values:

- `IDENTITY_TIER_MISMATCH`
- `SAMPLE_COUNT_BELOW_MINIMUM`
- `QUALITY_SCORE_BELOW_MINIMUM`
- `RUNTIME_EXCEEDED`
- `TRACE_SIGNATURE_INVALID`
- `HASHCASH_BITS_BELOW_MINIMUM`
- `STAKE_AMOUNT_BELOW_MINIMUM`
- `DEVICE_ATTESTATION_MISSING`
- `MANUAL_REVIEW_REQUIRED`

### Award and audit fields that must reuse verifier vocabulary

When verify output flows into award/audit payloads, keep these published fields and names intact:

- `AwardProofSummary`
  - `proofId`
  - `result`
  - `reasonCodes`
  - `requiredDifficulty`
  - `achievedDifficulty`
  - `verifiedAt`
  - `auditId`
- `TaskAwardProofSummary`
  - `proofId`
  - `result`
  - `decisionTraceHash`
  - `reasonCodes`
  - `policyTraceId`
- `TaskAwardedAuditPayload`
  - `awardedBidId`
  - `awardedAgentId`
  - `taskStatus`
  - `awardReason`
  - `decisionTraceHash`
  - `scoreSummary`
  - `proofSummary`

Award handlers should not invent a second proof-result dialect; they should carry forward the verify result, reason codes, and `decisionTraceHash` that already exist in the published contracts.

## 3. Runtime and QA should assert these error/result codes first

### Proof verify error codes

- `PROOF_POLICY_INPUT_INVALID`
- `PROOF_POLICY_TRACE_MISSING`
- `PROOF_POLICY_TRACE_NOT_FOUND`
- `PROOF_VERIFY_PAYLOAD_INVALID`
- `PROOF_VERIFY_POLICY_INVALID`
- `PROOF_VERIFY_FAILED`
- `PROOF_VERIFY_NEEDS_REVIEW`

### Award write/precondition error codes

- `TASK_AWARD_PRECONDITION_FAILED`
- `TASK_AWARD_PROOF_NOT_VERIFIED`
- `TASK_AWARD_CANDIDATE_NOT_ELIGIBLE`
- `TASK_AWARD_IDEMPOTENCY_CONFLICT`

### Minimum negative-path mapping for the live evidence lane

| Scenario | Expected terminal result or error code |
| --- | --- |
| malformed or incomplete proof payload | `PROOF_VERIFY_PAYLOAD_INVALID` |
| missing policy replay reference | `PROOF_POLICY_TRACE_MISSING` or `PROOF_POLICY_TRACE_NOT_FOUND` |
| proof below required threshold | `FAIL` plus `PROOF_VERIFY_FAILED` / reason-code evidence |
| verifier cannot auto-decide | `MANUAL_REVIEW` or `PROOF_VERIFY_NEEDS_REVIEW` |
| award attempted before proof is awardable | `TASK_AWARD_PRECONDITION_FAILED` or `TASK_AWARD_PROOF_NOT_VERIFIED` |
| award attempted for filtered-out candidate | `TASK_AWARD_CANDIDATE_NOT_ELIGIBLE` |
| repeated award write with the same idempotency key collision | `TASK_AWARD_IDEMPOTENCY_CONFLICT` |

Issue #111 remains the merged executable-QA baseline, but new evidence should be posted to issue #11 instead of reopening closed QA tracking issues.

## 4. Read-side status vocabulary already published on `main`

Use the merged read contracts additively instead of hiding refresh semantics inside write responses:

- `BidProofSubmission.verificationStatus`
  - `PENDING_VERIFY`, `PASS`, `FAIL`, `MANUAL_REVIEW`
- `ProofStatusResponse.verificationState`
  - queued/in-flight states: `QUEUED`, `VERIFYING`, `OVERRIDDEN`
  - terminal states: `PASS`, `FAIL`, `MANUAL_REVIEW`
- `BidStatusResponse.proofState`
  - `NOT_SUBMITTED`, `QUEUED`, `VERIFYING`, `OVERRIDDEN`, `PASS`, `FAIL`, `MANUAL_REVIEW`
- `BidStatusResponse.failureReasonCodes`
  - `BID_COMMIT_WINDOW_CLOSED`
  - `BID_COMMIT_DUPLICATE`
  - `BID_REVEAL_PAYLOAD_INVALID`
  - `BID_REVEAL_COMMIT_NOT_FOUND`
  - `BID_REVEAL_HASH_MISMATCH`
  - `BID_REVEAL_WINDOW_CLOSED`
  - `PROOF_VERIFY_FAILED`
  - `PROOF_VERIFY_NEEDS_REVIEW`
- `ProofStatusResponse.reasonCodes`
  - `PROOF_VERIFY_FAILED`
  - `PROOF_VERIFY_NEEDS_REVIEW`
  - `PROOF_VERIFY_PAYLOAD_INVALID`
  - `PROOF_VERIFY_POLICY_INVALID`

## 5. Reviewer quick-check command

Use this one command when a PR claims a verify/award field, enum, or error code is already on `main`:

```bash
rg -n "ProofVerificationReasonCode|PROOF_POLICY_TRACE_MISSING|TASK_AWARD_IDEMPOTENCY_CONFLICT|proofSchemaVersion|capturedAt|decisionTraceHash|verificationStatus" src/api/openapi.yaml src/api/contracts.ts
```

If the claimed field or enum is not returned by that command, the PR should either trim the wording back to the published contract or update `src/api/openapi.yaml` and `src/api/contracts.ts` in the same change.
