# Agent Verification Timeline Baseline (P1-22)

Last updated: 2026-03-17

## Objective

Define the agent-facing post-reveal timeline so an agent can understand whether a submitted bid proof is:

1. queued for verification,
2. actively verifying,
3. passed,
4. failed, or
5. routed to manual review.

This baseline stays honest about repository reality on `main`: commit/reveal write endpoints and bid/proof status read endpoints now exist, while local runtime persistence and smoke evidence still depend on implementation issues [#110](https://github.com/jckhang/agent-indeed/issues/110), [#115](https://github.com/jckhang/agent-indeed/issues/115), and [#136](https://github.com/jckhang/agent-indeed/issues/136).

## Scope

- Closed-beta agent workflow only.
- Verification timeline states, copy, and refresh expectations after reveal.
- Explicit fallback behavior when a local runtime has not yet populated the merged async status reads.

Out of scope:

- Rich visual design exploration.
- Operator override tooling.
- Event-stream transport; MVP stays bounded to polling plus manual refresh on the merged read endpoints.

## Agent workflow slice

| Step | Goal | Primary UI surface | Current backend status |
| --- | --- | --- | --- |
| 1 | Commit bid hash | `Commit workspace` | Ready now via `POST /v1/tasks/{taskId}/bids/commit` |
| 2 | Reveal bid + proof | `Reveal workspace` | Ready now via `POST /v1/tasks/{taskId}/bids/reveal` |
| 3 | Track verification progression | `Verification timeline` | Ready on `main`: `GET /v1/tasks/{taskId}/bids/{bidId}` and `GET /v1/tasks/{taskId}/proofs/{proofId}` expose queued/verifying/terminal projections when the runtime serves them |

## Timeline model

### 1. Queued

Purpose:
- Confirm the proof was received and is waiting for verifier pickup.

Agent copy:
- Primary: `Proof received. Verification is queued.`
- Supporting: `You do not need to resubmit your reveal. Check again for status updates.`

Current contract reality:
- `GET /v1/tasks/{taskId}/proofs/{proofId}` now returns `verificationState=QUEUED` when the runtime has persisted the proof for verifier pickup.
- If the running stack does not yet populate the projection, the UI should say the runtime status snapshot is unavailable rather than fabricating queued progress.

### 2. Verifying

Purpose:
- Show that backend verification has started but not finished.

Agent copy:
- Primary: `Proof verification is in progress.`
- Supporting: `The verifier is evaluating your submission against the task policy.`

Current contract reality:
- `GET /v1/tasks/{taskId}/proofs/{proofId}` and `GET /v1/tasks/{taskId}/bids/{bidId}` now provide the verifier-in-progress projection on `main`.
- The UI should treat `VERIFYING` as durable backend truth only when the runtime read model returns it, and otherwise fall back to an unavailable-projection message.

### 3. Passed

Purpose:
- Confirm the proof met the required PoMW threshold and the bid can stay in contention.

Agent copy:
- Primary: `Verification passed.`
- Supporting: `Your proof met the required difficulty for this task.`

Current contract reality:
- `POST /v1/tasks/{taskId}/proofs/verify` already returns `ProofVerificationResponse.result=PASS`.
- Reason codes and timestamps should be rendered when present; missing fields must degrade to neutral copy instead of invented detail.

### 4. Failed

Purpose:
- Explain that the proof was evaluated and did not satisfy policy requirements.

Agent copy:
- Primary: `Verification failed.`
- Supporting: `Your proof did not meet the required policy threshold.`

Current contract reality:
- `POST /v1/tasks/{taskId}/proofs/verify` already returns `ProofVerificationResponse.result=FAIL` plus optional `reasonCodes`.
- Agent-facing copy should map stable reason codes into actionable language, but should not claim richer failure context than the response actually provides.

### 5. Needs review

Purpose:
- Explain that the verifier could not make a clean terminal decision and operator review is required.

Agent copy:
- Primary: `Verification needs operator review.`
- Supporting: `Your proof was received, but the result needs manual review before the bid can advance.`

Current contract reality:
- `POST /v1/tasks/{taskId}/proofs/verify` already returns `ProofVerificationResponse.result=MANUAL_REVIEW`.
- The UI should not promise review SLA or operator actions unless those fields become part of the backend contract.

## Refresh strategy assumptions

### Current runtime-backed behavior on `main`

What the UI can promise now:
- Reveal acceptance is synchronous and can hand off `proofId` plus initial verification status into the read-model routes.
- Queued, verifying, and terminal proof outcomes can be read through `GET /v1/tasks/{taskId}/proofs/{proofId}` when the runtime has persisted the projection.
- Bid-level recovery after reload can use `GET /v1/tasks/{taskId}/bids/{bidId}` instead of caching browser-only state.

What the UI still cannot promise without the running stack:
- That every local environment already persists and serves the merged status projections.
- Polling cadence beyond the backend-provided `refresh.pollAfterSeconds` metadata.

Required product wording:
- If the projection is missing, say `Runtime verification status is not available from this environment yet.`
- Keep a manual `Refresh status` affordance available even while polling so local smoke runs can prove refresh behavior explicitly.

### MVP polling behavior

Recommended bounded behavior:
- Poll `GET /v1/tasks/{taskId}/proofs/{proofId}` on the backend-provided `refresh.pollAfterSeconds` cadence while state is non-terminal.
- Also refresh `GET /v1/tasks/{taskId}/bids/{bidId}` when the screen needs award or bid-level state changes.
- Stop polling immediately when a terminal state is returned.

### Optional later upgrade

- Event stream or push delivery can replace polling later, but it must reuse the same timeline state vocabulary so agent copy and QA scenarios do not drift.

## API-to-UI matrix

| UI surface | Contract/input | Current source | Status | Notes |
| --- | --- | --- | --- | --- |
| Commit workspace submit | `CommitBidRequest` | `POST /v1/tasks/{taskId}/bids/commit` | Ready | Existing write response is enough for commit confirmation |
| Reveal workspace submit | `RevealBidRequest` | `POST /v1/tasks/{taskId}/bids/reveal` | Ready | Existing write response is enough to confirm reveal acceptance |
| Verification timeline pending states | proof status read model (`QUEUED`, `VERIFYING`) | `GET /v1/tasks/{taskId}/proofs/{proofId}` | Ready on `main` | Runtime implementation must populate the projection for local runs; otherwise render unavailable-projection copy |
| Verification timeline terminal states | `ProofStatusResponse` and `ProofVerificationResponse` (`PASS`, `FAIL`, `MANUAL_REVIEW`, `OVERRIDDEN`) | `GET /v1/tasks/{taskId}/proofs/{proofId}` plus `POST /v1/tasks/{taskId}/proofs/verify` | Ready | Read route is the primary agent-facing source; verify write remains verifier/operator-only |
| Refresh controls | `RefreshPolicy`, `lastUpdatedAt`, `pollAfterSeconds` | `GET /v1/tasks/{taskId}/bids/{bidId}` and `GET /v1/tasks/{taskId}/proofs/{proofId}` | Ready on `main` | Use backend refresh metadata as the only polling truth |

## Failure and empty-state guidance

| Condition | Agent copy |
| --- | --- |
| Reveal accepted but no proof status read yet | `Runtime verification status is not available from this environment yet.` |
| Proof verification failed with reason codes | `Verification failed. Review the returned reason codes before retrying.` |
| Proof routed to manual review | `Verification needs operator review before this bid can advance.` |
| Proof status data missing optional timestamps or difficulty values | `Verification result received. Additional trace details are not available yet.` |

## Backend dependency feedback for backlog

P1-22 makes three concrete follow-ups explicit:

1. Runtime issue [#110](https://github.com/jckhang/agent-indeed/issues/110) must keep bid/proof status projections populated so the merged read routes are meaningful in local runs.
2. `QUEUED` and `VERIFYING` should remain explicit read-model states, not re-inferred from reveal success in the client.
3. Refresh policy metadata (`manualRefreshAllowed`, `pollAfterSeconds`, `lastUpdatedAt`) should stay shared between agent and operator flows so timeline behavior stays testable.

## Acceptance criteria mapping

| Acceptance criterion | Baseline coverage |
| --- | --- |
| Verification timeline covers queued, verifying, passed, failed, and needs-review states with operator-friendly copy. | This document defines all five states, their user-facing copy, and when the UI may present them as current truth versus planned read-model behavior. |
| Refresh strategy assumptions are explicit and bounded by the current backend contract. | `Current runtime-backed behavior on main`, `MVP polling behavior`, and `Optional later upgrade` separate merged read-model truth from environment-specific runtime gaps. |
| UI does not treat unavailable bid/proof runtime data as existing environment truth. | Every state section distinguishes merged API shape from a local runtime that may not yet serve the projection data. |
| Any missing async status implementation is linked back to the runtime execution threads. | The dependency is linked to issues `#110`, `#115`, and `#136` throughout this baseline. |
