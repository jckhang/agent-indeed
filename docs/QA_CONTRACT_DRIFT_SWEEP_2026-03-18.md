# QA Contract-Drift Sweep (2026-03-18)

Owner: `avery-chen`  
Linked issue: [#120](https://github.com/jckhang/agent-indeed/issues/120)

This dated sweep captures the current QA/risk pass over the active runtime/doc queue after the
2026-03-18 `main` refresh. It exists to keep reviewer comments anchored to the published contract
sources instead of repeated manual spot checks across PR threads.

## Canonical command

Run this from repo root whenever a runtime/doc PR claims a route, enum, or proof-verification
field is already on `main`:

```bash
npm run check:contract-drift
```

The command fails when:

- `src/api/openapi.yaml` and `src/api/contracts.ts` disagree on `ProofVerificationReasonCode`
- `src/api/openapi.yaml` and `src/api/contracts.ts` disagree on `ProofVerifyErrorCode`
- a required published runtime route disappears from OpenAPI

The JSON output also includes `src/api/openapi.yaml` line anchors for every required route so
review comments can cite the exact source-of-truth path definition instead of paraphrasing route
availability from memory.

## 2026-03-18 snapshot

Published runtime routes confirmed by the guard:

- `/healthz` — `src/api/openapi.yaml:20`
- `/readyz` — `src/api/openapi.yaml:33`
- `/v1/runtime/summary` — `src/api/openapi.yaml:46`
- `/v1/tasks/{taskId}` — `src/api/openapi.yaml:307`
- `/v1/tasks/{taskId}/audit-events` — `src/api/openapi.yaml:331`
- `/v1/tasks/{taskId}/candidates` — `src/api/openapi.yaml:355`
- `/v1/tasks/{taskId}/award` — `src/api/openapi.yaml:522`
- `/v1/tasks/{taskId}/bids/commit` — `src/api/openapi.yaml:609`
- `/v1/tasks/{taskId}/bids/{bidId}` — `src/api/openapi.yaml:763`
- `/v1/tasks/{taskId}/bids/reveal` — `src/api/openapi.yaml:681`
- `/v1/tasks/{taskId}/proof-policy` — `src/api/openapi.yaml:920`
- `/v1/tasks/{taskId}/proofs/{proofId}` — `src/api/openapi.yaml:1207`
- `/v1/tasks/{taskId}/proofs/verify` — `src/api/openapi.yaml:785`

Proof verification enums confirmed aligned between OpenAPI and TypeScript contracts:

- `ProofVerificationReasonCode`:
  `IDENTITY_TIER_MISMATCH`, `SAMPLE_COUNT_BELOW_MINIMUM`, `QUALITY_SCORE_BELOW_MINIMUM`,
  `RUNTIME_EXCEEDED`, `TRACE_SIGNATURE_INVALID`, `HASHCASH_BITS_BELOW_MINIMUM`,
  `STAKE_AMOUNT_BELOW_MINIMUM`, `DEVICE_ATTESTATION_MISSING`, `MANUAL_REVIEW_REQUIRED`
- `ProofVerifyErrorCode`:
  `PROOF_POLICY_INPUT_INVALID`, `PROOF_POLICY_TRACE_MISSING`, `PROOF_POLICY_TRACE_NOT_FOUND`,
  `PROOF_VERIFY_PAYLOAD_INVALID`, `PROOF_VERIFY_POLICY_INVALID`, `PROOF_VERIFY_FAILED`,
  `PROOF_VERIFY_NEEDS_REVIEW`

## Current reviewer focus

Use the snapshot above when reviewing the current queue:

- PR #149: runtime behavior may emit proof reason codes, but reviewer comments should distinguish
  "enum exists in contract" from "runtime implementation already returns the same field everywhere"
- PR #133 and PR #152: docs can cite the verified proof enums above plus the exact OpenAPI anchors
  for shortlist/award/bid/proof reads, but must still avoid inventing extra fields or enum members
  that are not in the API drafts
- planning rollups should reference this sweep or the API source files rather than paraphrasing
  route availability from memory
