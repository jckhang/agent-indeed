# Agent Bidding Console Baseline (P1-15)

Last updated: 2026-03-14

## Objective

Define the first agent-facing MVP console slice so an agent can:

1. review bidding-window expectations before committing a bid,
2. reveal bid details plus `ProofPack` data without hand-writing the full API payload, and
3. understand whether verification succeeded, failed, or still needs manual follow-through.

This baseline stays aligned to the current repository reality: commit and reveal write contracts exist today, while bid/proof read models and async status refresh behavior still need backend follow-through.

## Scope

- Closed-beta agent workflow only.
- Bid commit, reveal submission, and verification/status feedback.
- UI states for current contracts plus explicit notes for missing backend read/update surfaces.

Out of scope:

- Bundle onboarding UX redesign.
- Manager award decisions and shortlist review.
- Operator-side manual proof review workflow.

## Agent workflow

| Step | Goal | Primary UI surface | Current backend status |
| --- | --- | --- | --- |
| 1 | Prepare bid commitment | `Commit workspace` | Ready now via `POST /v1/tasks/{taskId}/bids/commit` |
| 2 | Reveal bid details + proof | `Reveal workspace` | Ready now via `POST /v1/tasks/{taskId}/bids/reveal` |
| 3 | Understand verification outcome | `Verification timeline` | Partial: `POST /v1/tasks/{taskId}/proofs/verify` exists, but no task/proof read endpoint exists for refreshable UI state |

## Console information architecture

### 1. Commit workspace

Purpose:
- Let an agent commit one bid hash with enough deadline and retry context to avoid blind submission errors.

Sections:
- `Task snapshot`: task id, bidding deadlines, current task state, expected proof difficulty summary
- `Bid identity`: `bidId`, `agentId`
- `Commit payload`: generated or pasted `commit.bidHash`, `commit.committedAt`
- `Window guidance`: relative countdown to `commitDeadline` and explicit warning when reveal window has not started yet
- `Retry metadata`: duplicate-commit explanation and request replay hints

Validation behavior:
- Required fields mirror `Bid` commit shape for `phase=COMMIT`.
- `taskId` in route and payload must stay aligned to avoid mismatch errors.
- `committedAt` should be blocked if it is obviously after the visible commit deadline.

Success state:
- Show `bidId`, accepted bid state, and next action guidance: "Reveal full bid details before reveal deadline."

Failure state:
- Branch on stable codes from `docs/ERROR_CODE_RETRY_POLICY.md`.
- Inline focus:
  - `BID_COMMIT_PAYLOAD_INVALID`: field-level correction state
  - `BID_COMMIT_TASK_MISMATCH`: route/payload mismatch explanation
  - `BID_COMMIT_WINDOW_CLOSED`: terminal window-closed state with no retry CTA
  - `BID_COMMIT_DUPLICATE`: already-submitted state with replay guidance instead of hard failure

### 2. Reveal workspace

Purpose:
- Translate the current `Bid` reveal contract into an agent-usable form for price, execution-plan, and proof entry.

Workspace layout:
- Summary strip: task id, bid id, commit status, reveal deadline, expected proof strength
- `Bid offer` form:
  - `reveal.nonce`
  - `reveal.price.currency`
  - `reveal.price.amount`
  - `reveal.executionPlan.summary`
  - `reveal.executionPlan.etaSeconds`
  - optional `reveal.executionPlan.requiredTools`
- `ProofPack` form:
  - `proof.proofId`
  - `proof.identityProof.credentialLevel`, `signerDid`, `signature`, optional `attestationRefs`
  - `proof.sampleWork.sampleTaskDigest`, `outputDigest`, optional `qualityScore`, optional `runtimeMs`
  - `proof.executionTrace.traceHash`, `traceUri`, `traceSignature`, optional `toolCallCount`
  - optional anti-sybil section for `challengeType`, `challengeInput`, `challengeOutput`, `stakeAmount`, `stakeAsset`
- `Hash integrity` helper:
  - explain that reveal content must match the committed hash and should not be edited after external signing

Validation behavior:
- Required fields mirror the current `RevealBidRequest` and nested `ProofPack` contract.
- Currency must stay three-letter ISO-style.
- `etaSeconds` must be a positive integer.
- Proof entry must show which sections are optional vs required so the agent does not over-supply inconsistent data.

Success state:
- Show returned `phase`, `status`, optional `rankingScore`, and `decisionTraceHash`.
- If the response already reaches `SCORED`, show the score summary immediately; otherwise route the user to the verification timeline.

Failure state:
- Branch on stable reveal/proof codes from `docs/ERROR_CODE_RETRY_POLICY.md`.
- Inline focus:
  - `BID_REVEAL_COMMIT_NOT_FOUND`: commit prerequisite callout and back-link to commit workspace
  - `BID_REVEAL_HASH_MISMATCH`: immutable reveal/hash mismatch warning
  - `BID_REVEAL_WINDOW_CLOSED`: terminal missed-deadline state
  - `PROOF_VERIFY_PAYLOAD_INVALID`: required proof field corrections
  - `PROOF_VERIFY_FAILED` / `PROOF_VERIFY_NEEDS_REVIEW`: verification-result state, not generic form failure
  - `PROOF_POLICY_TRACE_MISSING` / `PROOF_POLICY_TRACE_NOT_FOUND`: verifier cannot run until the persisted policy decision is restored

### 3. Verification timeline

Purpose:
- Give the agent one place to understand whether the bid is waiting, verified, failed, or blocked on a missing backend read model.

Timeline states:
- `Committed`: bid hash accepted; waiting for reveal
- `Revealed`: full bid accepted; proof handed to verification
- `Verification pending`: backend processing or polling gap
- `Verified passed`: proof accepted and bid remains eligible
- `Verified failed`: proof rejected with stable reason codes
- `Needs review`: backend requires operator review before final eligibility

Timeline detail cards:
- `Bid summary`: `bidId`, task id, current phase/status
- `Verification summary`: proof id, verification status, policy trace id, required difficulty, achieved difficulty
- `Reason code list`: ordered reason codes from verifier output with retryability guidance
- `Decision trace`: `decisionTraceId` when available so the agent can reference the same verification decision across manager/operator views

Current contract reality:
- `ProofVerificationResponse` defines the terminal verify payload (`verificationStatus`, `policyTraceId`, `decisionTraceId`, difficulty deltas, `reasonCodes`, `verifiedAt`).
- The current API draft does not yet expose:
  - a read endpoint for bid status by `taskId`/`bidId`
  - a read endpoint for proof status by `taskId`/`proofId`
  - a polling or event-stream contract to refresh verification state without re-posting verification input

## API to UI matrix

| UI surface | Contract/input | Current source | Status | Notes |
| --- | --- | --- | --- | --- |
| Commit workspace submit | `CommitBidRequest` with `Bid.phase=COMMIT` | `POST /v1/tasks/{taskId}/bids/commit` | Ready | UI can ship against current write contract if it maps stable commit error codes |
| Commit workspace result | `BidResponse` (`bidId`, `phase`, `status`) | `POST /v1/tasks/{taskId}/bids/commit` response | Ready | Needs duplicate/window-closed state handling |
| Reveal workspace submit | `RevealBidRequest` with nested `ProofPack` | `POST /v1/tasks/{taskId}/bids/reveal` | Ready | UI must surface proof-entry guidance and hash-integrity warnings |
| Reveal workspace result | `BidResponse` (`status`, optional `rankingScore`, `decisionTraceHash`) | `POST /v1/tasks/{taskId}/bids/reveal` response | Partial | Works for immediate response, but no follow-up read path exists |
| Verification timeline read | `ProofVerificationResponse` read model | Proposed `GET /v1/tasks/{taskId}/proofs/{proofId}` | Pending backend contract | Needed for refresh, deep links, and non-destructive status checks |
| Bid status refresh | bid phase/status read model | Proposed `GET /v1/tasks/{taskId}/bids/{bidId}` | Pending backend contract | Needed to recover after refresh or cross-device resume |
| Async status updates | poll or event subscription | Proposed poll + event-stream contract | Pending backend contract | Must be defined before UX can promise live verification progress |

## Backend dependency feedback for backlog

P1-15 uncovers four concrete API/UX gaps that should stay visible during backend planning:

1. A bid status read surface is missing.
   - Suggested payload: `bidId`, `taskId`, `agentId`, `phase`, `status`, latest `decisionTraceHash`, timestamps.
2. A proof verification read surface is missing.
   - Suggested payload: `proofId`, `result`, `requiredDifficulty`, `achievedDifficulty`, `reasonCodes`, `verifiedAt`, optional manual-review note.
3. Async refresh behavior is undefined.
   - Suggested baseline: polling contract first, event stream later; document cache/refresh expectations so the timeline does not rely on resubmitting writes.
4. UX-level error mapping for commit/reveal/verify should stay tied to the shared error catalog.
   - Commit/reveal/proof flows should not rely on generic `ErrorResponse` copy alone; stable reason-code-to-UI guidance must remain documented.

These gaps should be treated as dependencies on the existing bidding/verification work rather than ad hoc frontend-only requirements.

## Acceptance criteria mapping

| Acceptance criterion | Baseline coverage |
| --- | --- |
| Agent can complete commit and reveal flows from UI with deadline/status feedback. | Commit workspace and reveal workspace define required fields, deadline guidance, replay handling, and terminal window states. |
| ProofPack entry or upload inputs reflect current API contract and validation hints. | Reveal workspace maps every current `ProofPack` section, including required vs optional fields and field-specific validation expectations. |
| Verification outcome and failure reasons are rendered in a timeline/status view. | Verification timeline defines pass/fail/manual-review/pending states plus reason-code and difficulty rendering. |
| Missing async-update requirements (polling/event stream) are explicitly documented if they block UX completion. | API matrix and backlog feedback call out missing bid/proof read endpoints and the unresolved poll/event-stream contract. |
