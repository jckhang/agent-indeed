# Frontend Runtime Integration Tranche (P1-40)

Last updated: 2026-03-17

Related issue: [#136](https://github.com/jckhang/agent-indeed/issues/136)

## Objective

Capture the first runtime-backed frontend handoff slice for this week's execution sprint so the MVP can be demonstrated through real manager and agent flows instead of static-fixture-only wiring.

This tranche is intentionally grounded in the current `main` baseline:
- manager publish uses `POST /v1/tasks`
- manager shortlist and award-readiness use `GET /v1/tasks/{taskId}/candidates` and `GET /v1/tasks/{taskId}/award`
- agent commit/reveal uses `POST /v1/tasks/{taskId}/bids/commit` and `POST /v1/tasks/{taskId}/bids/reveal`
- agent verification/status refresh uses `GET /v1/tasks/{taskId}/bids/{bidId}` and `GET /v1/tasks/{taskId}/proofs/{proofId}`
- proof verification remains verifier/operator-only through `POST /v1/tasks/{taskId}/proofs/verify`

Execution dependencies remain explicit:
- runtime service baseline: [#115](https://github.com/jckhang/agent-indeed/issues/115)
- runnable vertical slice: [#110](https://github.com/jckhang/agent-indeed/issues/110)
- QA runtime checks: [#111](https://github.com/jckhang/agent-indeed/issues/111)

## Scope

In scope:
- one manager runtime path: publish -> shortlist review -> award-readiness review
- one agent runtime path: commit -> reveal -> verification-status refresh
- loading, empty, error, and retry-safe state expectations tied to the merged read/write contracts
- one local runbook for exercising the path against the runtime stack

Out of scope:
- visual design or component-library expansion
- operator queue/review implementation details beyond dependency notes
- manual proof-override tooling
- frontend-only mock payloads presented as primary integration truth

## Runtime-backed route map

| Route | Persona | Primary API dependency | Runtime expectation |
| --- | --- | --- | --- |
| `/manager/tasks/new` | Manager | `POST /v1/tasks` | Publish a task and transition into a created task summary with real deadlines/status |
| `/manager/tasks/{taskId}/review` | Manager | `GET /v1/tasks/{taskId}/candidates`, `GET /v1/tasks/{taskId}/award` | Render shortlist freshness, candidate ranking, blockers, and award-readiness from runtime reads |
| `/agent/tasks/{taskId}/bid-workspace` | Agent | `POST /v1/tasks/{taskId}/bids/commit`, `POST /v1/tasks/{taskId}/bids/reveal` | Preserve server-authored window state and hand off to verification without inventing hidden state |
| `/agent/tasks/{taskId}/verification` | Agent | `GET /v1/tasks/{taskId}/bids/{bidId}`, `GET /v1/tasks/{taskId}/proofs/{proofId}` | Poll and manually refresh until proof reaches a terminal verification state |

## Manager runtime flow

### 1. Publish task

Input source:
- `TaskSpec` form groups from `docs/MANAGER_TASK_COMPOSER_UI_SLICE.md`

Runtime contract:
- `POST /v1/tasks`

UI requirements:
- disable duplicate submit while request is in flight
- keep request payload aligned to current `TaskSpec` and `CreateTaskRequest`
- on success, persist `taskId`, `status`, `commitDeadline`, and `revealDeadline` for the review handoff
- on failure, reuse `ApiErrorResponse.code`, `retryable`, and `auditId` instead of generic fallback text

### 2. Review shortlist

Input source:
- route `taskId`
- manager session and workspace scope

Runtime contract:
- `GET /v1/tasks/{taskId}/candidates`

UI requirements:
- prefer runtime candidate rows over static fixture packs whenever the endpoint returns data
- show shortlist freshness and candidate count from the response instead of synthesized placeholders
- preserve partial candidate rows when score breakdown, proof readiness, or trace refs are missing
- surface `TASK_MATCH_NOT_READY` or equivalent retryable loading state as `Shortlist still generating`, not as an empty result

### 3. Review award readiness

Runtime contract:
- `GET /v1/tasks/{taskId}/award`

UI requirements:
- show `status`, `statusMessage`, shortlisted or awarded bid ids, proof summary, and handoff status directly from the read model
- treat `BLOCKED` and `PENDING_REVIEW` as first-class review states with visible blocker copy
- keep award action copy secondary when runtime handlers from #110 are not yet available in the running stack
- do not substitute operator audit timeline data for manager award summary state

## Agent runtime flow

### 1. Commit bid

Runtime contract:
- `POST /v1/tasks/{taskId}/bids/commit`

UI requirements:
- preserve server-authored `window.currentPhase`, deadlines, and `nextAction`
- treat `BID_COMMIT_DUPLICATE` as replay-safe recovery and restore the accepted commit snapshot
- render terminal window-closed states without offering a false retry path

### 2. Reveal bid and proof

Runtime contract:
- `POST /v1/tasks/{taskId}/bids/reveal`

UI requirements:
- require a successful commit or recovered replay result before enabling reveal
- validate required `ProofPack` sections before submit
- hand off `proofSubmission.proofId` and `verificationStatus` to the verification route after acceptance
- keep `POST /v1/tasks/{taskId}/proofs/verify` out of the agent UI path; verification is observed through runtime reads, not triggered by the agent

### 3. Refresh bid/proof status

Runtime contracts:
- `GET /v1/tasks/{taskId}/bids/{bidId}`
- `GET /v1/tasks/{taskId}/proofs/{proofId}`

UI requirements:
- show queued/verifying/terminal proof states from the backend projection instead of inferring them forever from reveal success
- use `refresh.pollAfterSeconds`, `refresh.manualRefreshAllowed`, and `refresh.lastUpdatedAt` as the only polling truth
- map `failureReasonCodes` and `reasonCodes` into stable agent copy without inventing richer hidden backend detail
- stop polling when proof state reaches `PASS`, `FAIL`, `MANUAL_REVIEW`, or `OVERRIDDEN`

## Loading, empty, error, and retry-safe states

| Surface | State | Required behavior |
| --- | --- | --- |
| Manager publish | submitting | Lock primary CTA, preserve draft, and show that duplicate publish is prevented locally only for the current session |
| Manager shortlist | loading | Render task header plus shortlist skeleton; never fake ranked rows |
| Manager shortlist | empty | Distinguish `no eligible candidates yet` from `matching still running` |
| Manager shortlist | partial | Keep returned rows visible and badge missing score/proof fields |
| Manager award-readiness | blocked | Render backend `statusMessage` plus dependency note when runtime award action is not yet wired |
| Agent commit | duplicate replay | Reuse accepted commit result and move focus to reveal |
| Agent reveal | hash mismatch | Explain immutable-payload requirement and return the user to reveal preparation |
| Agent verification | queued/verifying | Poll using backend refresh metadata and keep manual refresh available |
| Agent verification | terminal fail | Show returned reason codes and preserve trace/audit references when present |
| Agent verification | missing projection | Explain that runtime status projection is not yet available for this proof instead of inventing state |

## Local runtime runbook

This runbook is the minimum reproducible handoff for issue #136. It assumes the runtime implementation issues [#115](https://github.com/jckhang/agent-indeed/issues/115) and [#110](https://github.com/jckhang/agent-indeed/issues/110) have produced a locally runnable service.

### 1. Start the runtime

- start the local control-plane service using the command/run instructions published by the runtime implementation PR
- confirm the service exposes the merged `main` API surface from `src/api/openapi.yaml`
- capture the base URL, manager auth header, agent auth header, and verifier/operator credential used for local smoke runs

### 2. Exercise the manager path

1. Publish a task with `POST /v1/tasks`
   - record `taskId`, `status`, `commitDeadline`, and `revealDeadline`
2. Open the manager review route for the created `taskId`
   - confirm shortlist loading state is visible before data returns
3. Read `GET /v1/tasks/{taskId}/candidates`
   - confirm ranked rows or a retryable `not ready` state render without falling back to fixture-only content
4. Read `GET /v1/tasks/{taskId}/award`
   - confirm award-readiness copy uses backend `status` and `statusMessage`

### 3. Exercise the agent path

1. Commit a bid with `POST /v1/tasks/{taskId}/bids/commit`
   - record `bidId`, `window.currentPhase`, and `window.nextAction`
2. Reveal with `POST /v1/tasks/{taskId}/bids/reveal`
   - record `proofSubmission.proofId` and initial verification status
3. Refresh `GET /v1/tasks/{taskId}/bids/{bidId}`
   - confirm bid, proof, and award state projections render without browser-only inference
4. Refresh `GET /v1/tasks/{taskId}/proofs/{proofId}` until terminal
   - confirm polling cadence follows `refresh.pollAfterSeconds`
   - confirm terminal state and reason codes match the backend response

### 4. Capture evidence

Record the following in issue [#136](https://github.com/jckhang/agent-indeed/issues/136) and the linked PR:
- runtime base commit or image/version under test
- task id, bid id, and proof id used in the smoke path
- whether manager shortlist and award-readiness reads returned runtime data
- whether agent bid/proof status reads returned queued/verifying/terminal states correctly
- any blockers from #110, #115, or #111 that prevented full execution

## Acceptance criteria mapping

| Acceptance criterion | How this tranche covers it |
| --- | --- |
| At least one manager flow and one agent flow execute against local runtime APIs end-to-end. | The runbook defines one concrete manager path and one concrete agent path against merged runtime endpoints on `main`. |
| UI state transitions reflect runtime statuses and error reasons instead of placeholder-only states. | Loading/error/empty/retry-safe requirements and route-specific runtime expectations are tied to read/write response fields already present in `src/api/openapi.yaml` and `src/api/contracts.ts`. |
| A reproducible local runbook and evidence links are posted back to this issue. | The local runtime runbook specifies the minimum evidence to post back to issue #136 and the linked PR. |
| Progress references implementation threads #110 and #115. | Both dependencies are named in the objective, execution dependency list, and runbook. |
