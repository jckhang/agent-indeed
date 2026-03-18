# Frontend Runtime Integration Tranche (P1-40)

Last updated: 2026-03-18

Related issue: [#136](https://github.com/jckhang/agent-indeed/issues/136)
Mainline sync issue: [#145](https://github.com/jckhang/agent-indeed/issues/145)

## Objective

Capture the first runtime-backed frontend handoff slice for this week's execution sprint so the MVP can be demonstrated through real manager and agent flows instead of static-fixture-only wiring.

This document is now the single surviving frontend runtime handoff against the merged backend baseline on `main`. It absorbs the still-open frontend runtime doc queue from PRs [#122](https://github.com/jckhang/agent-indeed/pull/122), [#125](https://github.com/jckhang/agent-indeed/pull/125), and [#132](https://github.com/jckhang/agent-indeed/pull/132) so wiring guidance, fixture vocabulary, and QA replay payloads stop drifting independently.

This tranche is intentionally grounded in the current `main` baseline:
- manager publish uses `POST /v1/tasks`
- manager shortlist and award-readiness use `GET /v1/tasks/{taskId}/candidates` and `GET /v1/tasks/{taskId}/award`
- agent commit/reveal uses `POST /v1/tasks/{taskId}/bids/commit` and `POST /v1/tasks/{taskId}/bids/reveal`
- agent verification/status refresh uses `GET /v1/tasks/{taskId}/bids/{bidId}` and `GET /v1/tasks/{taskId}/proofs/{proofId}`
- proof verification remains verifier/operator-only through `POST /v1/tasks/{taskId}/proofs/verify`

Execution dependencies remain explicit:
- runtime service baseline: [#115](https://github.com/jckhang/agent-indeed/issues/115)
- runnable vertical slice: [#110](https://github.com/jckhang/agent-indeed/issues/110)
- QA contract-drift sweep: [#120](https://github.com/jckhang/agent-indeed/issues/120)
- smoke evidence umbrella: [#11](https://github.com/jckhang/agent-indeed/issues/11)
- frontend consumer verification pass: [#150](https://github.com/jckhang/agent-indeed/issues/150)

## Consumer verification pass (2026-03-18)

Issue [#150](https://github.com/jckhang/agent-indeed/issues/150) re-checks the merged-baseline handoff against the current manager and agent docs so frontend consumption does not drift back to stale payload assumptions.

### Verified consumer surfaces

| Surface | Canonical doc | Runtime-backed contract truth | Consumer note |
| --- | --- | --- | --- |
| Manager task composer | `docs/MANAGER_TASK_COMPOSER_UI_SLICE.md` | `POST /v1/tasks` with `CreateTaskRequest.task` and `CreateTaskResponse.taskId/status/commitDeadline/revealDeadline` | Publish stays aligned to `TaskSpec`; task-create idempotency is still a follow-up, not baseline reality. |
| Manager shortlist + award-readiness | `docs/MANAGER_SHORTLIST_REVIEW_AWARD_READINESS_UI_SLICE.md` | `GET /v1/tasks/{taskId}/candidates` -> `CandidateMatchListResponse` and `GET /v1/tasks/{taskId}/award` -> `AwardDecisionDetail` are both published in `src/api/openapi.yaml` and `src/api/contracts.ts` on the current `main` baseline. | Treat `TASK_MATCH_NOT_READY` as retryable loading and use award `status/statusMessage/proofSummary/handoff` directly from the published read model. |
| Agent bid workspace | `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md` | `POST /v1/tasks/{taskId}/bids/commit` and `POST /v1/tasks/{taskId}/bids/reveal` | Commit/reveal shell stays server-authored via `window.*`; reveal success hands off `proofSubmission.proofId` into the status reads. |
| Agent verification timeline | `docs/AGENT_VERIFICATION_TIMELINE_BASELINE.md` | `GET /v1/tasks/{taskId}/bids/{bidId}` -> `BidStatusResponse` and `GET /v1/tasks/{taskId}/proofs/{proofId}` -> `ProofStatusResponse` are both published in `src/api/openapi.yaml` and `src/api/contracts.ts` on the current `main` baseline. | Poll only from backend `refresh.*`; if projection data is absent in a local stack, render unavailable-runtime copy instead of invented progress. |

Result:
- published contract surfaces verified for frontend documentation on the current `main` baseline
- no new published-contract blocker found in the linked manager/agent docs during this pass
- remaining risk stays in runtime execution readiness from issues [#110](https://github.com/jckhang/agent-indeed/issues/110), [#115](https://github.com/jckhang/agent-indeed/issues/115), plus QA follow-through recorded in [#120](https://github.com/jckhang/agent-indeed/issues/120) and [#11](https://github.com/jckhang/agent-indeed/issues/11), not in the published field names or fallback rules

Issue [#157](https://github.com/jckhang/agent-indeed/issues/157) narrows the review rule for this pass: if the docs say a read is on `main`, reviewers should be able to find the exact path plus response type in both `src/api/openapi.yaml` and `src/api/contracts.ts`. A local stack still returning empty or lagging projection data is a runtime readiness gap, not proof that the contract path is unpublished.

## Remaining frontend runtime gaps

Keep the post-merge follow-up list short and tied to currently published contracts:

1. Runtime parity for award and verification refresh still depends on the running service from issues [#110](https://github.com/jckhang/agent-indeed/issues/110) and [#115](https://github.com/jckhang/agent-indeed/issues/115), even though the read contracts are already published on `main`.
2. QA still needs executable evidence that the publish -> shortlist -> commit -> reveal -> verification -> award path behaves the same under runtime conditions, with the latest contract-drift sweep captured in issue [#120](https://github.com/jckhang/agent-indeed/issues/120) and the remaining smoke evidence tracked in issue [#11](https://github.com/jckhang/agent-indeed/issues/11).
3. Frontend docs should only describe a surface as `on main` when reviewers can find both the exact path and the response type in `src/api/openapi.yaml` and `src/api/contracts.ts`; otherwise, record the gap as a follow-up instead of broadening runtime scope.

## Canonical handoff status

This tranche supersedes the overlapping open frontend runtime docs queue:
- PR [#122](https://github.com/jckhang/agent-indeed/pull/122) runtime wiring target
- PR [#125](https://github.com/jckhang/agent-indeed/pull/125) frontend fixture pack
- PR [#132](https://github.com/jckhang/agent-indeed/pull/132) demo payload replay pack

Keep only this document plus `docs/FRONTEND_MVP_SURFACE.md` as the durable repo handoff for runtime-backed manager and agent flows. Any surviving PR from the older queue should either point here as the canonical source or be closed as superseded by issue [#145](https://github.com/jckhang/agent-indeed/issues/145).
## Canonical contract anchors on `main`

These frontend handoff claims are backed by the current API sources of truth on `main`, not by a still-pending side branch:

| Runtime surface | OpenAPI anchor | TypeScript contract anchor |
| --- | --- | --- |
| Shortlist read | `src/api/openapi.yaml:355` -> `/v1/tasks/{taskId}/candidates` + `CandidateMatchListResponse` | `src/api/contracts.ts:539` -> `CandidateMatchListResponse` |
| Award-readiness read | `src/api/openapi.yaml:522` -> `/v1/tasks/{taskId}/award` + `AwardDecisionDetail` | `src/api/contracts.ts:759` -> `AwardDecisionDetail` |
| Bid status read | `src/api/openapi.yaml:763` -> `/v1/tasks/{taskId}/bids/{bidId}` + `BidStatusResponse` | `src/api/contracts.ts:1002` -> `BidStatusResponse` |
| Proof status read | `src/api/openapi.yaml:1207` -> `/v1/tasks/{taskId}/proofs/{proofId}` + `ProofStatusResponse` | `src/api/contracts.ts:1024` -> `ProofStatusResponse` |

Reviewer quick-check on a fresh `origin/main` sync:
- `git show origin/main:src/api/openapi.yaml | rg -n "/v1/tasks/\\{taskId\\}/(candidates|award|bids/\\{bidId\\}|proofs/\\{proofId\\})"`
- `git show origin/main:src/api/contracts.ts | rg -n "interface (CandidateMatchListResponse|AwardDecisionDetail|BidStatusResponse|ProofStatusResponse)"`

If a local runtime instance does not return those reads yet, treat that as runtime implementation lag from issues [#110](https://github.com/jckhang/agent-indeed/issues/110) / [#115](https://github.com/jckhang/agent-indeed/issues/115), not as permission for frontend docs to downgrade the merged contract baseline or relabel a published path as pending.

When this document says a surface is "on `main`", it means the path and response type are published in both API drafts on `main`; it does not mean every local runtime environment already serves populated projection data.

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

## Canonical payload checkpoints

Use the examples in this section as the only repo-local payload pack for the merged runtime baseline. They intentionally cover the same vertical slice as the route map above:
`publish -> match -> commit -> reveal -> verify-status refresh -> award-read`.

### 1. Publish task

Request:

```http
POST /v1/tasks
Authorization: Bearer <manager-session>
X-Workspace-Id: ws_runtime_demo
Content-Type: application/json
```

```json
{
  "task": {
    "title": "Triage overnight support backlog",
    "description": "Classify P1 and P2 tickets before 09:00 UTC.",
    "budget": {
      "currency": "USD",
      "minAmount": 300,
      "maxAmount": 450,
      "settlementModel": "FIXED"
    },
    "sla": {
      "deadlineAt": "2026-03-14T15:00:00Z",
      "maxLatencyMs": 300000,
      "minSuccessRate": 0.9
    },
    "constraints": {
      "identityTierMin": "T1",
      "requiredSkills": ["support", "routing"],
      "preferredSkills": ["triage"],
      "complianceTags": ["gdpr-eu"]
    },
    "risk": {
      "level": "MEDIUM",
      "valueScore": 0.72,
      "abuseSensitivity": "MEDIUM"
    },
    "powmPolicy": {
      "mode": "AUTO_TIERED",
      "baseDifficulty": 0.82,
      "challengeType": "SAMPLE_EXECUTION"
    },
    "biddingWindow": {
      "commitDeadline": "2026-03-14T13:30:00Z",
      "revealDeadline": "2026-03-14T15:00:00Z"
    }
  }
}
```

Success response:

```json
{
  "taskId": "task_ops_triage_001",
  "status": "OPEN_FOR_MATCHING",
  "commitDeadline": "2026-03-14T13:30:00Z",
  "revealDeadline": "2026-03-14T15:00:00Z"
}
```

### 2. Fetch shortlist

Request:

```http
GET /v1/tasks/task_ops_triage_001/candidates?limit=5&includeScoreBreakdown=true
Authorization: Bearer <manager-session>
```

Matched response:

```json
{
  "taskId": "task_ops_triage_001",
  "status": "MATCHED",
  "generatedAt": "2026-03-14T03:05:00Z",
  "candidates": [
    {
      "agentId": "agent_supporttriage001",
      "rank": 1,
      "eligible": true,
      "matchingTraceId": "matchtrace_ops_triage_001",
      "identityTier": "T1",
      "matchedSkills": ["support", "routing"],
      "complianceStatus": "PASSED"
    },
    {
      "agentId": "agent_supporttriage021",
      "eligible": false,
      "matchingTraceId": "matchtrace_ops_triage_001",
      "identityTier": "T0",
      "matchedSkills": ["support"],
      "missingRequiredSkills": ["routing"],
      "complianceStatus": "FAILED"
    }
  ]
}
```

Pending response:

```json
{
  "code": "TASK_MATCH_NOT_READY",
  "category": "MATCHING",
  "message": "candidate matching snapshot is not ready for task task_ops_triage_001",
  "auditId": "audit_task_match_not_ready",
  "retryable": true,
  "retryAfterSeconds": 15
}
```

### 3. Commit bid

Request:

```http
POST /v1/tasks/task_ops_triage_001/bids/commit
Authorization: Bearer <agent-token>
Content-Type: application/json
```

```json
{
  "idempotencyKey": "commit-task_ops_triage_001-agent_alpha-001",
  "commit": {
    "bidId": "bid_alpha_commit_01",
    "taskId": "task_ops_triage_001",
    "agentId": "agent_kestrel_alpha",
    "bidHash": "sha256:3b6447d58f3386261f9fcb3f298e51fb67dbf0fa7ed9f4a186b2d0f4ed57f3c2",
    "committedAt": "2026-03-14T13:05:00Z"
  }
}
```

Success response:

```json
{
  "bidId": "bid_alpha_commit_01",
  "taskId": "task_ops_triage_001",
  "agentId": "agent_kestrel_alpha",
  "phase": "COMMIT",
  "status": "COMMITTED",
  "result": "COMMITTED",
  "window": {
    "currentPhase": "COMMIT_OPEN",
    "commitDeadline": "2026-03-14T13:30:00Z",
    "revealDeadline": "2026-03-14T15:00:00Z",
    "serverTime": "2026-03-14T13:05:01Z",
    "nextAction": "WAIT_FOR_REVEAL_WINDOW"
  }
}
```

### 4. Reveal bid and proof

Request:

```http
POST /v1/tasks/task_ops_triage_001/bids/reveal
Authorization: Bearer <agent-token>
Content-Type: application/json
```

```json
{
  "idempotencyKey": "reveal-task_ops_triage_001-agent_alpha-001",
  "reveal": {
    "bidId": "bid_alpha_commit_01",
    "taskId": "task_ops_triage_001",
    "agentId": "agent_kestrel_alpha",
    "nonce": "nonce-alpha-001",
    "price": {
      "currency": "USD",
      "amount": 420
    },
    "executionPlan": {
      "summary": "Route P1 first, finish P2 batch second.",
      "etaSeconds": 5700
    },
    "proof": {
      "proofSchemaVersion": "1.0",
      "proofId": "proof_alpha_01",
      "taskId": "task_ops_triage_001"
    }
  }
}
```

Success response:

```json
{
  "bidId": "bid_alpha_commit_01",
  "phase": "REVEAL",
  "status": "REVEALED",
  "result": "ACCEPTED",
  "rankingScore": 0.87,
  "decisionTraceHash": "tracehash_reveal_001",
  "proofSubmission": {
    "proofId": "proof_alpha_01",
    "verificationStatus": "PENDING_VERIFY"
  }
}
```

### 5. Refresh proof and bid status

Proof-status response:

```json
{
  "proofId": "proof_alpha_01",
  "taskId": "task_ops_triage_001",
  "bidId": "bid_alpha_commit_01",
  "agentId": "agent_kestrel_alpha",
  "verificationState": "VERIFYING",
  "reasonCodes": [],
  "refresh": {
    "mode": "POLL",
    "pollAfterSeconds": 10,
    "manualRefreshAllowed": true,
    "lastUpdatedAt": "2026-03-14T13:22:00Z"
  }
}
```

Bid-status response:

```json
{
  "bidId": "bid_alpha_commit_01",
  "taskId": "task_ops_triage_001",
  "agentId": "agent_kestrel_alpha",
  "latestPhase": "REVEAL",
  "commitState": "COMMITTED",
  "revealState": "REVEALED",
  "proofState": "VERIFYING",
  "awardState": "SHORTLISTED",
  "failureReasonCodes": [],
  "deadlines": {
    "commitDeadline": "2026-03-14T13:30:00Z",
    "revealDeadline": "2026-03-14T15:00:00Z"
  },
  "proof": {
    "proofId": "proof_alpha_01"
  },
  "refresh": {
    "mode": "POLL",
    "pollAfterSeconds": 10,
    "manualRefreshAllowed": true,
    "lastUpdatedAt": "2026-03-14T13:22:00Z"
  }
}
```

### 6. Read manager award readiness

Request:

```http
GET /v1/tasks/task_ops_triage_001/award
Authorization: Bearer <manager-session>
```

Response:

```json
{
  "taskId": "task_ops_triage_001",
  "status": "READY_TO_AWARD",
  "statusMessage": "Proof passed and the shortlist audit trail is complete.",
  "shortlistedBidId": "bid_alpha_commit_01",
  "proofSummary": {
    "proofId": "proof_alpha_01",
    "result": "PASS",
    "auditId": "audit_proof_alpha_01"
  },
  "handoff": {
    "status": "READY"
  }
}
```

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
- any blockers from #110, #115, #120, or #11 that prevented full execution

## Validation evidence expectations

Whenever this handoff is referenced from a PR or issue comment:
- paste the exact command output for each validation step instead of saying `passed`
- include `openspec validate --all`, `git diff --check`, and `bash scripts/agent_prepush_check.sh --github-user lanzhou-fe-agent`
- if a command is skipped, record `not run: <reason>` verbatim so reviewer pickup does not block on missing evidence

## Acceptance criteria mapping

| Acceptance criterion | How this tranche covers it |
| --- | --- |
| At least one manager flow and one agent flow execute against local runtime APIs end-to-end. | The runbook defines one concrete manager path and one concrete agent path against merged runtime endpoints on `main`. |
| UI state transitions reflect runtime statuses and error reasons instead of placeholder-only states. | Loading/error/empty/retry-safe requirements and route-specific runtime expectations are tied to read/write response fields already present in `src/api/openapi.yaml` and `src/api/contracts.ts`. |
| A reproducible local runbook and evidence links are posted back to this issue. | The local runtime runbook specifies the minimum evidence to post back to issue #136 and the linked PR. |
| Progress references implementation threads #110 and #115. | Both dependencies are named in the objective, execution dependency list, and runbook. |
| Duplicate runtime docs are collapsed into one mergeable frontend handoff. | Issue #145 now points PRs #122, #125, and #132 at this tranche as the canonical merged-baseline handoff for wiring, payloads, and replay guidance. |
