# Agent Verification Timeline Baseline (P1-22)

Last updated: 2026-03-14

## Objective

Define the agent-facing post-reveal timeline so an agent can understand whether a submitted bid proof is:

1. queued for verification,
2. actively verifying,
3. passed,
4. failed, or
5. routed to manual review.

This baseline stays honest about repository reality on `main`: commit/reveal write endpoints exist today, but the async bid/proof read contract is still pending backend follow-through in issue [#59](https://github.com/jckhang/agent-indeed/issues/59) and PR [#66](https://github.com/jckhang/agent-indeed/pull/66).

## Scope

- Closed-beta agent workflow only.
- Verification timeline states, copy, and refresh expectations after reveal.
- Explicit fallback behavior when the backend cannot yet expose async status reads.

Out of scope:

- Rich visual design exploration.
- Operator override tooling.
- Event-stream transport; MVP is bounded to manual refresh today and polling once the read contract merges.

## Agent workflow slice

| Step | Goal | Primary UI surface | Current backend status |
| --- | --- | --- | --- |
| 1 | Commit bid hash | `Commit workspace` | Ready now via `POST /v1/tasks/{taskId}/bids/commit` |
| 2 | Reveal bid + proof | `Reveal workspace` | Ready now via `POST /v1/tasks/{taskId}/bids/reveal` |
| 3 | Track verification progression | `Verification timeline` | Partial: terminal verify response exists, but no merged read endpoint exposes queued/verifying states yet |

## Timeline model

### 1. Queued

Purpose:
- Confirm the proof was received and is waiting for verifier pickup.

Agent copy:
- Primary: `Proof received. Verification is queued.`
- Supporting: `You do not need to resubmit your reveal. Check again for status updates.`

Current contract reality:
- The current API can only infer this immediately after reveal is accepted (`BidResponse.phase=REVEAL`, `BidResponse.status=REVEALED`).
- No merged proof read endpoint exists on `main`, so the UI must present this as a pending state, not as a durable backend truth.

### 2. Verifying

Purpose:
- Show that backend verification has started but not finished.

Agent copy:
- Primary: `Proof verification is in progress.`
- Supporting: `The verifier is evaluating your submission against the task policy.`

Current contract reality:
- This state is planned in the async read contract tracked by issue [#59](https://github.com/jckhang/agent-indeed/issues/59) and PR [#66](https://github.com/jckhang/agent-indeed/pull/66).
- Until that contract merges, the UI must not render `Verifying` as if it were currently queryable.

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

### Current fallback on `main`

What the UI can promise now:
- Reveal acceptance is synchronous and can move the timeline into a pending verification state.
- Terminal proof outcomes can be shown only when the current session receives a `ProofVerificationResponse`.

What the UI cannot promise yet:
- A durable read path for queued or verifying state.
- Background auto-refresh that discovers a terminal result after the page is reloaded.

Required product wording:
- Show an explicit dependency callout: `Live verification refresh depends on the bid/proof status read contract (issue #59 / PR #66).`
- Keep a manual `Refresh status` affordance visually secondary until the read endpoint is merged, so the UI does not imply current functionality that the backend cannot support.

### MVP target once PR #66 lands

Recommended bounded behavior:
- Poll `GET /v1/tasks/{taskId}/proofs/{proofId}` on a short interval (for example 10-15 seconds) while status is non-terminal.
- Always keep a manual refresh action available.
- Stop polling immediately when a terminal state is returned.

### Optional later upgrade

- Event stream or push delivery can replace polling later, but it must reuse the same timeline state vocabulary so agent copy and QA scenarios do not drift.

## API-to-UI matrix

| UI surface | Contract/input | Current source | Status | Notes |
| --- | --- | --- | --- | --- |
| Commit workspace submit | `CommitBidRequest` | `POST /v1/tasks/{taskId}/bids/commit` | Ready | Existing write response is enough for commit confirmation |
| Reveal workspace submit | `RevealBidRequest` | `POST /v1/tasks/{taskId}/bids/reveal` | Ready | Existing write response is enough to confirm reveal acceptance |
| Verification timeline pending states | proof status read model (`queued`, `verifying`) | Proposed backend read contract in issue #59 / PR #66 | Pending backend contract | Must stay labeled as pending until read endpoint merges |
| Verification timeline terminal states | `ProofVerificationResponse` (`PASS`, `FAIL`, `MANUAL_REVIEW`) | `POST /v1/tasks/{taskId}/proofs/verify` | Partial | Works only when the current session receives the verify response |
| Refresh controls | `RefreshPolicy`, `lastUpdatedAt`, `pollAfterSeconds` | Proposed backend read contract in issue #59 / PR #66 | Pending backend contract | Use dependency callout instead of pretending these fields already exist |

## Failure and empty-state guidance

| Condition | Agent copy |
| --- | --- |
| Reveal accepted but no proof status read yet | `Verification updates are not live yet; check back after the status-read contract lands.` |
| Proof verification failed with reason codes | `Verification failed. Review the returned reason codes before retrying.` |
| Proof routed to manual review | `Verification needs operator review before this bid can advance.` |
| Proof status data missing optional timestamps or difficulty values | `Verification result received. Additional trace details are not available yet.` |

## Backend dependency feedback for backlog

P1-22 makes three concrete follow-ups explicit:

1. The bid/proof status read contract remains a frontend blocker until PR [#66](https://github.com/jckhang/agent-indeed/pull/66) merges.
2. `queued` and `verifying` should be explicit read-model states, not inferred forever from reveal success.
3. Refresh policy metadata (`manualRefreshAllowed`, `pollAfterSeconds`, `lastUpdatedAt`) should be shared between agent and operator flows so timeline behavior stays testable.

## Acceptance criteria mapping

| Acceptance criterion | Baseline coverage |
| --- | --- |
| Verification timeline covers queued, verifying, passed, failed, and needs-review states with operator-friendly copy. | This document defines all five states, their user-facing copy, and when the UI may present them as current truth versus planned read-model behavior. |
| Refresh strategy assumptions are explicit and bounded by the current backend contract. | `Current fallback on main`, `MVP target once PR #66 lands`, and `Optional later upgrade` separate present-day behavior from the proposed polling contract. |
| UI does not treat unavailable bid/proof read fields as existing contract reality. | Every pending-state section marks queued/verifying reads and refresh metadata as dependency work, not merged API truth. |
| Any missing async status contract is linked back to backend issue `#59` or a new follow-up issue. | The dependency is linked to both issue `#59` and active PR `#66` throughout this baseline. |
