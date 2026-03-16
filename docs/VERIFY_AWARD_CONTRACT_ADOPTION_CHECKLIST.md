# Verify-Award Contract Adoption Checklist

Last updated: 2026-03-17

Related threads:

- Issue [#131](https://github.com/jckhang/agent-indeed/issues/131)
- Runtime implementation issue [#110](https://github.com/jckhang/agent-indeed/issues/110)
- QA execution issue [#111](https://github.com/jckhang/agent-indeed/issues/111)
- Merged verifier contract PR [#83](https://github.com/jckhang/agent-indeed/pull/83)
- Merged audit trace PR [#92](https://github.com/jckhang/agent-indeed/pull/92)

## Purpose

Turn the merged verifier contract into one concrete checklist so runtime work and QA assertions use the same
field names, terminal result vocabulary, and blocker language across the `verify -> award` segment.

## Contract baseline to consume now

### Settled in `main`

- PR #83 defines the verifier request/response and proof failure vocabulary in `src/api/openapi.yaml` and
  `src/api/contracts.ts`.
- PR #92 defines the canonical audit event names and award trace payload fields that runtime work must emit.

### Newly merged around the edge of this flow

- PR #66 merged on 2026-03-17 and adds bid/proof status read endpoints plus queued/verifying refresh semantics on `main`.
- PR #68 merged on 2026-03-16 and adds shortlist review context plus award detail read/write contracts for manager-facing reads on `main`.

## Runtime adoption checklist for issue #110

### 1. Verify handler input contract: consume these fields exactly

Issue #110 should treat the merged verifier write contract as locked for handler input parsing:

- request envelope:
  - `policyTraceId`
  - `proof`
- `proof` identity fields:
  - `proofSchemaVersion`
  - `proofId`
  - `taskId`
  - `agentId`
  - `capturedAt`
- `proof.identityProof`:
  - `credentialLevel`
  - `signerDid`
  - `signature`
  - optional `attestationRefs[]`
- `proof.sampleWork`:
  - `sampleTaskDigest`
  - `outputDigest`
  - optional `qualityScore`
  - optional `runtimeMs`
- `proof.executionTrace`:
  - `traceHash`
  - `traceUri`
  - `traceSignature`
  - optional `toolCallCount`
- `proof.antiSybil`:
  - optional `challengeType`
  - optional `challengeInput`
  - optional `challengeOutput`
  - optional `stakeAmount`
  - optional `stakeAsset`

Do not silently rename `policyTraceId`, infer a policy snapshot on the fly, or collapse nested proof evidence into
an ad hoc runtime-only shape. Persist enough of the request to replay verification and to join later audit/award
records back to the same frozen policy snapshot.

### 2. Verify handler output contract: persist and return these fields

Issue #110 should produce the merged `ProofVerificationResponse` shape and keep the same field names in storage
or in the translation layer that backs writes:

- `proofId`
- terminal `result`: `PASS`, `FAIL`, `MANUAL_REVIEW`
- `policyTraceId`
- `requiredPolicy`
- `requiredDifficulty`
- `achievedDifficulty`
- optional `decisionTraceHash`
- optional `reasonCodes[]`
- optional `verifiedAt`

The runtime implementation should also wire the settled audit event vocabulary from PR #92:

- `POMW_VERIFIED`
- `TASK_AWARDED`

For award persistence, use the merged trace names now instead of inventing alternates:

- `decisionTraceHash`
- proof result summary fields
- selected `bidId` / `agentId`
- award rationale summary

### 3. Verify and award error handling: preserve stable vocabulary

Issue #110 should return the merged verify failure codes without introducing local aliases:

- `PROOF_POLICY_TRACE_MISSING`
- `PROOF_POLICY_TRACE_NOT_FOUND`
- `PROOF_VERIFY_PAYLOAD_INVALID`
- `PROOF_VERIFY_POLICY_INVALID`
- `PROOF_VERIFY_FAILED`
- `PROOF_VERIFY_NEEDS_REVIEW`

Award-path negative handling should continue to use the shared catalog already present on `main`:

- `TASK_AWARD_PRECONDITION_FAILED`
- `TASK_AWARD_PROOF_NOT_VERIFIED`
- `TASK_AWARD_CANDIDATE_NOT_ELIGIBLE`

If issue #110 chooses to implement award idempotency now that PR #68 is merged, keep the code name aligned with the
settled contract: `TASK_AWARD_IDEMPOTENCY_CONFLICT`.

## QA-first assertion checklist for issue #111

Issue #111 should assert the verify and award vocabulary in this order before expanding into richer polling/read
coverage:

### Tier 1: terminal verify result assertions

- successful verify returns `result=PASS`
- failing verify returns `result=FAIL`
- manual-review verify returns `result=MANUAL_REVIEW`
- every terminal verify response preserves `policyTraceId`
- terminal verify responses include the difficulty pair:
  - `requiredDifficulty`
  - `achievedDifficulty`
- when emitted, `reasonCodes[]` and `decisionTraceHash` remain machine-readable and do not require parsing free text

### Tier 2: negative-path code assertions

- missing policy snapshot -> `PROOF_POLICY_TRACE_MISSING`
- unknown policy snapshot -> `PROOF_POLICY_TRACE_NOT_FOUND`
- malformed proof payload -> `PROOF_VERIFY_PAYLOAD_INVALID`
- proof below threshold -> `PROOF_VERIFY_FAILED`
- verifier cannot conclude automatically -> `PROOF_VERIFY_NEEDS_REVIEW`
- award attempted before verify-ready task state -> `TASK_AWARD_PRECONDITION_FAILED`
- award attempted with non-passing proof -> `TASK_AWARD_PROOF_NOT_VERIFIED`

### Tier 3: audit/award linkage assertions once runtime emits them

- a passing verify can be traced into a persisted `POMW_VERIFIED` event
- a successful award emits `TASK_AWARDED`
- award evidence preserves `decisionTraceHash`
- proof result summary carried into award/audit uses the same terminal vocabulary: `PASS`, `FAIL`, `MANUAL_REVIEW`

## Merged follow-through map

| Thread | What it changed | Issue #110 follow-through | Issue #111 follow-through | Status on `main` |
| --- | --- | --- | --- | --- |
| PR #66 (merged 2026-03-17) | Bid/proof status reads, queued/verifying polling, refresh hints | Runtime can keep the first vertical slice scoped to stable write responses, then add the merged read projections when internal status persistence is ready. | QA can add queued/verifying read coverage once the runtime serves the merged status endpoints in local runs. | Merged; downstream runtime/QA adoption still pending |
| PR #68 (merged 2026-03-16) | Shortlist review context and award detail read/write contract | Runtime should consume the settled shortlist/award field names instead of inventing local aliases, but can phase richer manager reads after the core write path is stable. | QA can defer manager shortlist evidence and award-detail assertions until the runtime exposes those merged read surfaces. | Merged; downstream runtime/QA adoption still pending |

## Recommended execution order

1. Issue #110: lock verify handler parsing and storage to the PR #83 field names first.
2. Issue #110: emit PR #92 audit event names and `decisionTraceHash` without waiting for read endpoints.
3. Issue #111: assert terminal verify results and negative error codes before adding polling/read assertions.
4. After those foundations land, layer in the merged PR #66 polling reads and PR #68 shortlist/award detail assertions without renaming the now-settled fields.
