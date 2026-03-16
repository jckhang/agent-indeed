# Agent Bid Commit/Reveal Workspace (P1-21)

Last updated: 2026-03-15

## Objective

Define the focused frontend execution slice for issue #63 so an agent can move from bid commitment to reveal submission inside one workflow without carrying the full verification-timeline scope in the same delivery item.

This slice builds on `docs/AGENT_BIDDING_CONSOLE_BASELINE.md`: commit/reveal entry is implementable now against the current write contracts, while long-lived verification refresh remains an explicit backend follow-up through issue #59.

## Scope

In scope:
- One task-scoped workspace that covers commit preparation, reveal preparation, and proof-pack entry.
- Deadline and phase feedback based on the current bid window snapshot returned by commit/reveal writes.
- Field-level validation guidance for `RevealBidRequest` and nested `ProofPack` requirements.
- Actionable UX for commit-window closed, reveal-without-commit, reveal hash mismatch, and proof payload validation failures.

Out of scope:
- Async verification polling or event-stream design.
- Operator-side manual review flows.
- Manager shortlist, award, or audit timeline UX.

## Workspace model

Route suggestion:
- `/agent/tasks/{taskId}/bid-workspace`

The route keeps a single persistent shell with stage-aware panels instead of sending the agent through unrelated pages. The shell should always show:
- `Task summary`: task id, visible commit/reveal deadlines, current task/bid phase, expected proof difficulty summary.
- `Workflow state`: `Prepare commit`, `Ready to reveal`, `Reveal submitted`, or `Blocked`.
- `Next-action callout`: derived from `window.nextAction` so the UI stays tied to server truth instead of browser time alone.

## Stage 1: Commit preparation

Purpose:
- Help the agent submit one valid commit payload before the commit deadline and understand whether the server accepted or replayed the request.

Fields and helpers:
- `idempotencyKey`
- `commit.bidId`
- `commit.taskId`
- `commit.agentId`
- `commit.bidHash`
- `commit.committedAt`
- Helper copy for how the commit hash was produced and why the reveal payload must stay hash-consistent afterward

Validation and state rules:
- Route `taskId` and `commit.taskId` must match.
- `committedAt` should be blocked when it is obviously past the visible commit deadline.
- If the workspace already has a returned `COMMITTED` response, the shell should preserve that accepted result and move focus to reveal instead of offering a second blank commit form.

Failure rendering:
- `BID_COMMIT_PAYLOAD_INVALID`: show field-level corrections and keep the user in the commit stage.
- `BID_COMMIT_TASK_MISMATCH`: explain route/payload mismatch and highlight the conflicting identifiers.
- `BID_COMMIT_WINDOW_CLOSED`: switch the stage to terminal blocked state with no retry CTA.
- `BID_COMMIT_DUPLICATE`: show replay-safe success messaging and restore the recorded bid metadata from the server response details.

## Stage 2: Reveal preparation

Purpose:
- Let the agent finish the commercial offer and proof submission in the same workspace once commit is accepted.

Reveal sections:
- `Reveal identity`: `reveal.bidId`, `reveal.taskId`, `reveal.agentId`, `reveal.nonce`
- `Commercial offer`: `reveal.price.currency`, `reveal.price.amount`
- `Execution plan`: `reveal.executionPlan.summary`, `reveal.executionPlan.etaSeconds`, optional `requiredTools`
- `ProofPack`: all current required nested sections from the shared contract

Required ProofPack coverage:
- `proof.proofId`
- `proof.identityProof.credentialLevel`, `signerDid`, `signature`, optional `attestationRefs`
- `proof.sampleWork.sampleTaskDigest`, `outputDigest`, optional `qualityScore`, optional `runtimeMs`
- `proof.executionTrace.traceHash`, `traceUri`, `traceSignature`, optional `toolCallCount`
- Optional anti-sybil challenge inputs remain visible but clearly secondary so agents do not confuse optional evidence with baseline required fields

Validation and state rules:
- The reveal stage stays disabled until commit succeeds or a replayed commit result is recovered.
- The UI must highlight missing required proof sections before submit instead of surfacing only generic API errors.
- `etaSeconds` must stay a positive integer and currency must stay a three-letter code.
- The hash-integrity helper should warn that editing signed reveal content after commit can trigger `BID_REVEAL_HASH_MISMATCH`.

Failure rendering:
- `BID_REVEAL_COMMIT_NOT_FOUND`: show a blocking prerequisite card with a jump-back to the commit stage.
- `BID_REVEAL_HASH_MISMATCH`: show immutable-payload guidance and instruct the user to regenerate the reveal payload from the original committed content.
- `BID_REVEAL_WINDOW_CLOSED`: show missed-deadline state with no retry CTA.
- `PROOF_VERIFY_PAYLOAD_INVALID`: mark the missing or malformed proof sections directly in the form.

Success state:
- Show `status`, `result`, optional `rankingScore`, `decisionTraceHash`, and `proofSubmission.proofId` + `verificationStatus`.
- If verification is still pending, hand off to the verification route with a clear note that the current repository lacks a durable read model for refresh-safe progress tracking.

## Cross-stage empty, loading, and blocked states

- `Loading existing bid context`: needed when the workspace is opened from a previously accepted commit or reveal result cached by the client.
- `Commit window not open / reveal not open yet`: show countdown plus the server-provided next action.
- `Reveal without commit`: never present the reveal form as primary when no accepted commit exists.
- `Window expired`: preserve server timestamps and returned reason codes so support or operators can cross-reference the same bid attempt.

## API-to-UI contract mapping

| Workspace action | Contract/input | Current API source | Status | Notes |
| --- | --- | --- | --- | --- |
| Commit submit | `CommitBidRequest` | `POST /v1/tasks/{taskId}/bids/commit` | Ready | Current write contract already returns `window` snapshot and replay-safe result metadata |
| Commit replay/closed handling | `CommitBidAcceptedResponse` + `CommitBidErrorResponse` | `POST /v1/tasks/{taskId}/bids/commit` response | Ready | Workspace should branch on stable reason codes instead of generic error copy |
| Reveal submit | `RevealBidRequest` | `POST /v1/tasks/{taskId}/bids/reveal` | Ready | All required `ProofPack` sections can be represented now |
| Reveal result handoff | `RevealBidAcceptedResponse` + `RevealBidErrorResponse` | `POST /v1/tasks/{taskId}/bids/reveal` response | Partial | Immediate post-submit handoff works, but refresh-safe reads still depend on issue #59 |
| Verification follow-through | proof/bid read model | Proposed `GET /v1/tasks/{taskId}/bids/{bidId}` and `GET /v1/tasks/{taskId}/proofs/{proofId}` | Pending backend contract | Needed to restore workspace state after browser refresh or cross-device resume |

## Backend dependency feedback

P1-21 keeps four follow-ups explicit instead of hiding them inside frontend-only assumptions:

1. A bid workspace read model is still missing.
   - Minimum payload: `bidId`, `taskId`, `agentId`, `phase`, `status`, accepted commit timestamp, optional reveal timestamp, latest `decisionTraceHash`, and current window snapshot.
2. Proof verification still needs a read endpoint.
   - Minimum payload: `proofId`, `verificationStatus`/`result`, required vs achieved difficulty, `reasonCodes`, `verifiedAt`, optional manual-review note.
3. Window state should stay server-authored.
   - Any future read model must echo the same `window` snapshot shape already returned by commit/reveal writes so frontend countdown and CTA logic do not drift.
4. Required-vs-optional proof metadata needs to stay shared.
   - If `ProofPack` changes, this workspace spec, `src/api/openapi.yaml`, and `src/api/contracts.ts` must be updated together.

## Acceptance criteria mapping

| Acceptance criterion | Workspace coverage |
| --- | --- |
| Agent can prepare a commit payload and reveal payload from one workflow with clear deadline/state feedback. | Single route, stage-aware shell, and `window.nextAction` guidance keep commit and reveal in one focused workspace. |
| ProofPack entry/upload inputs align with the current contract and highlight missing required sections before submit. | Reveal stage maps every current required `ProofPack` section and distinguishes required vs optional evidence. |
| UX states cover commit-window closed, reveal-without-commit, and payload validation failures. | Failure rendering and cross-stage blocked states define explicit handling for each requested case. |
| Scope stays focused on commit/reveal interaction and does not absorb async verification timeline work. | Verification follow-through is limited to handoff notes; read-model and polling gaps stay tracked as dependencies on issue #59. |
