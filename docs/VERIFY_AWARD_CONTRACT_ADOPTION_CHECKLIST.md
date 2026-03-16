# Verify/Award Contract Adoption Checklist

Last updated: 2026-03-17

This checklist translates the merged verifier contract from PR #83 and the merged
bid/proof status and shortlist/award read contracts from PR #66 and PR #68 into
minimum field and vocabulary guidance for runtime issue #110 and QA issue #111.

Use this document when deciding whether a verify/award behavior is already
contract-frozen on `main`, should be consumed additively from merged follow-up
contracts, or still belongs in a new downstream issue instead of a local alias.

## 1. Runtime handlers in issue #110 must consume these verify inputs now

### Verify request preconditions

- Use `POST /v1/tasks/{taskId}/proofs/verify` as the write surface.
- Require the path `taskId` plus request body fields:
  - `policyTraceId`
  - `proof`
- Reject requests that do not replay an already persisted policy snapshot from
  `POST /v1/tasks/{taskId}/proof-policy`.
- Treat verifier security and audit headers as part of the contract:
  - `VerifierService` requires `proof.verify`
  - `OperatorSession` requires `proof.verify.override`
  - operator/manual override paths must carry `X-Audit-Reason`

### Proof payload fields that are already frozen on `main`

`proof` must preserve the merged `ProofPack` shape:

- identity + linkage
  - `proof.proofSchemaVersion`
  - `proof.proofId`
  - `proof.taskId`
  - `proof.agentId`
  - `proof.capturedAt`
- identity evidence
  - `proof.identityProof.credentialLevel`
  - `proof.identityProof.signerDid`
  - `proof.identityProof.signature`
- work sample
  - `proof.sampleWork.sampleTaskDigest`
  - `proof.sampleWork.outputDigest`
  - optional: `qualityScore`, `runtimeMs`
- execution trace
  - `proof.executionTrace.traceHash`
  - `proof.executionTrace.traceUri`
  - `proof.executionTrace.traceSignature`
  - optional: `toolCallCount`
- optional anti-sybil section
  - `proof.antiSybil.challengeType`
  - `proof.antiSybil.challengeInput`
  - `proof.antiSybil.challengeOutput`
  - `proof.antiSybil.stakeAmount`
  - `proof.antiSybil.stakeAsset`

## 2. Runtime handlers in issue #110 must persist these verify outputs now

The runtime verify path should store and replay the full terminal response shape:

| Field | Why it matters now |
| --- | --- |
| `proofId` | Stable proof record key for read-side recovery and audit joins. |
| `result` | Frozen terminal vocabulary for verify/award gating: `PASS`, `FAIL`, `MANUAL_REVIEW`. |
| `policyTraceId` | Ensures verify, audit, and award all point at the same policy snapshot. |
| `requiredPolicy` | Preserves the resolved policy decision for later replay/debug. |
| `requiredDifficulty` | Lets QA and audit compare expected vs. achieved thresholds. |
| `achievedDifficulty` | Required to explain pass/fail outcomes deterministically. |
| `decisionTraceHash` | Canonical hash to carry from verify into audit and award evidence. |
| `reasonCodes[]` | Stable machine-readable explanation for failure/review states. |
| `verifiedAt` | Terminal timestamp for polling/read-side handoff and audit review. |

For the award segment of issue #110, the merged audit contract already freezes
the payload that should be emitted when an award is recorded:

- audit event type: `TASK_AWARDED`
- payload fields:
  - `awardedBidId`
  - `awardedAgentId`
  - `taskStatus` (`AWARDED` or `CLOSED_NO_AWARD`)
  - `awardReason`
  - `decisionTraceHash`
  - `scoreSummary`
  - `proofSummary`

`proofSummary` should reuse verifier vocabulary rather than inventing an
award-only status dialect:

- `proofId`
- `result`
- `decisionTraceHash`
- `reasonCodes`
- `policyTraceId`

If issue #110 chooses to implement award idempotency now that PR #68 is merged,
keep the code name aligned with the settled contract:
`TASK_AWARD_IDEMPOTENCY_CONFLICT`.

## 3. QA issue #111 should assert this terminal vocabulary first

### Verification terminal results

QA should treat only these values as terminal proof outcomes:

- `PASS`
- `FAIL`
- `MANUAL_REVIEW`

### Proof reason codes that can appear in terminal verify output

QA can assert these stable verifier reason codes today:

- `IDENTITY_TIER_MISMATCH`
- `SAMPLE_COUNT_BELOW_MINIMUM`
- `QUALITY_SCORE_BELOW_MINIMUM`
- `RUNTIME_EXCEEDED`
- `TRACE_SIGNATURE_INVALID`
- `HASHCASH_BITS_BELOW_MINIMUM`
- `STAKE_AMOUNT_BELOW_MINIMUM`
- `DEVICE_ATTESTATION_MISSING`
- `MANUAL_REVIEW_REQUIRED`

### Error codes QA should cover before wider polling/read work

Proof verify errors:

- `PROOF_POLICY_INPUT_INVALID`
- `PROOF_POLICY_TRACE_MISSING`
- `PROOF_POLICY_TRACE_NOT_FOUND`
- `PROOF_VERIFY_PAYLOAD_INVALID`
- `PROOF_VERIFY_POLICY_INVALID`
- `PROOF_VERIFY_FAILED`
- `PROOF_VERIFY_NEEDS_REVIEW`

Award/precondition errors:

- `TASK_AWARD_PRECONDITION_FAILED`
- `TASK_AWARD_PROOF_NOT_VERIFIED`
- `TASK_AWARD_CANDIDATE_NOT_ELIGIBLE`

### Minimum negative-path mapping for issue #111

| Scenario | Expected terminal result or error code |
| --- | --- |
| malformed or incomplete proof payload | `PROOF_VERIFY_PAYLOAD_INVALID` |
| missing policy replay reference | `PROOF_POLICY_TRACE_MISSING` or `PROOF_POLICY_TRACE_NOT_FOUND` |
| proof below required threshold | `PROOF_VERIFY_FAILED` plus `requiredDifficulty` / `achievedDifficulty` |
| verifier cannot auto-decide | `MANUAL_REVIEW` or `PROOF_VERIFY_NEEDS_REVIEW` |
| award attempted before proof is awardable | `TASK_AWARD_PRECONDITION_FAILED` or `TASK_AWARD_PROOF_NOT_VERIFIED` |
| award attempted for filtered-out candidate | `TASK_AWARD_CANDIDATE_NOT_ELIGIBLE` |

## 4. Merged follow-through from PR #66 and PR #68

PR #68 merged at 2026-03-16T23:29Z and PR #66 merged at 2026-03-17T01:38Z.
They are no longer open blockers in this checklist; they are merged contracts
that runtime and QA should adopt in sequence.

| Thread | Status on `main` | Runtime follow-through | QA follow-through |
| --- | --- | --- | --- |
| PR #66 `Define bid/proof status polling contract` | Merged on 2026-03-17 | Keep the first runnable write path stable, then add the merged bid/proof status projections plus refresh hints when issue #110 is ready to expose read endpoints. | Add queued/verifying polling assertions once local runtime runs actually serve the merged status endpoints. |
| PR #68 `[P1-17] Define manager shortlist and award read-model contracts` | Merged on 2026-03-16 | Consume the settled shortlist/award field names and idempotency vocabulary instead of inventing runtime-local aliases; phase richer manager reads additively after the core write path is stable. | Defer manager shortlist evidence and award-detail assertions until the runtime exposes those merged read surfaces. |

## 5. Implementation notes for runtime + QA handoff

- Do not invent new verify result strings beyond `PASS`, `FAIL`, and
  `MANUAL_REVIEW`.
- Do not let award code recompute or rename the proof decision basis; pass
  through `policyTraceId` and `decisionTraceHash`.
- Use the merged PR #66 read shapes for queued/verifying polling rather than
  hiding refresh semantics in write responses.
- Use the merged PR #68 shortlist and award-detail fields additively instead of
  widening the verify response or introducing a parallel manager shape.
- When posting evidence on issue #110 or issue #111, include the exact terminal
  result or error code observed so reviewers can match it back to this checklist.
