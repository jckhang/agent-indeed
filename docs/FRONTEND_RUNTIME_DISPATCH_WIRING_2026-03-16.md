# Frontend Runtime Dispatch Wiring Target (Week of 2026-03-16)

Last updated: 2026-03-17

Related issue: [#116](https://github.com/jckhang/agent-indeed/issues/116)
Related runtime backend slice: [#110](https://github.com/jckhang/agent-indeed/issues/110)

## Objective

Define one frontend runtime-backed dispatch loop that uses the contracts already present on `main` and stays explicit about the remaining read-model gaps.

This target keeps the UI honest in the current repo state:
- task publish, candidate shortlist, bid commit, bid reveal, bid-status read, proof-status read, award-detail read, and task audit timeline contracts now exist on `main`
- verifier-only proof checks still stay off-limits to the manager/agent UI flow even though `POST /v1/tasks/{taskId}/proofs/verify` is published for operator/verifier scopes
- runtime issue [#110](https://github.com/jckhang/agent-indeed/issues/110) still owns local persistence/materialization gaps, so the frontend should use merged read models without pretending every local run already serves fully populated snapshots

## Runtime-backed vertical slice

The runtime slice for this week is:
`publish -> match -> commit -> reveal -> status-refresh -> award-read`

Bounded interpretation for the current contract stack:
- `publish`: `POST /v1/tasks`
- `match`: `GET /v1/tasks/{taskId}/candidates`
- `commit`: `POST /v1/tasks/{taskId}/bids/commit`
- `reveal`: `POST /v1/tasks/{taskId}/bids/reveal`
- `status-refresh`: use `GET /v1/tasks/{taskId}/proofs/{proofId}` and `GET /v1/tasks/{taskId}/bids/{bidId}` to replace the initial reveal snapshot when runtime projections are available
- `award-read`: use `GET /v1/tasks/{taskId}/award` for manager-facing status, proof summary, and handoff readiness instead of deriving award state from shortlist rank or audit events

## Flow contract map

| Flow step | Primary route | Runtime endpoint | Current frontend behavior target |
| --- | --- | --- | --- |
| Publish task | `/manager/tasks/new` | `POST /v1/tasks` | Submit real `TaskSpec`, keep returned `taskId`, and transition into matching review instead of fixture-only confirmation. |
| Match candidates | `/manager/tasks/{taskId}/review` | `GET /v1/tasks/{taskId}/candidates` | Render ranked and ineligible rows from the live shortlist response, including `matchingTraceId`, eligibility gates, and optional `scoreBreakdown`. |
| Commit bid | `/agent/tasks/{taskId}/bid-workspace` | `POST /v1/tasks/{taskId}/bids/commit` | Use the server-authored `window` snapshot to drive next-step copy and disable local deadline guessing. |
| Reveal bid | `/agent/tasks/{taskId}/bid-workspace` | `POST /v1/tasks/{taskId}/bids/reveal` | Keep `proofSubmission.proofId`, `verificationStatus`, `rankingScore`, and `decisionTraceHash` as the only durable post-reveal fields. |
| Verification status | `/agent/tasks/{taskId}/verification` | `GET /v1/tasks/{taskId}/proofs/{proofId}` plus optional `GET /v1/tasks/{taskId}/bids/{bidId}` for shared refresh state | Read queued/verifying/terminal proof status from the merged projections, while keeping the reveal response as the fallback snapshot when local runtime persistence is not populated yet. |
| Award read | `/manager/tasks/{taskId}/award` | `GET /v1/tasks/{taskId}/award` | Render `status`, `statusMessage`, `proofSummary`, `decisionTraceHash`, and `handoff` from the merged read model; disable confirm CTA unless the read model says `READY_TO_AWARD`. |

## Required UI state handling

### 1. `TASK_MATCH_NOT_READY`

When `GET /v1/tasks/{taskId}/candidates` returns `409 TASK_MATCH_NOT_READY`:
- preserve the task summary instead of rendering an empty shortlist
- show `Matching snapshot is still generating.` as the primary state
- honor `retryAfterSeconds` when present for the next poll hint
- keep shortlist controls disabled until a real shortlist snapshot arrives

Manager copy baseline:
- Primary: `Candidate matching is still generating a shortlist.`
- Supporting: `No ranking decision has been produced yet. Check again after the retry delay.`

### 2. Verification status refresh

When reveal succeeds:
- treat `proofSubmission.verificationStatus=PENDING_VERIFY` as the first post-reveal snapshot, then switch to `GET /v1/tasks/{taskId}/proofs/{proofId}` and `GET /v1/tasks/{taskId}/bids/{bidId}` when those projections are available
- do not call `POST /v1/tasks/{taskId}/proofs/verify` from the manager or agent UI flow; that endpoint is verifier/operator scope only on the current contract baseline
- if the runtime stack behind issue [#110](https://github.com/jckhang/agent-indeed/issues/110) has not populated the read models yet, preserve the reveal snapshot and explain that live refresh is still catching up
- keep the verification route visible, but annotate stale or missing projection data as a runtime follow-through gap rather than a missing contract gap

Agent copy baseline:
- Primary: `Proof submitted. Verification is pending.`
- Supporting: `Live status refresh uses the merged proof and bid read models, but local runtime data may still lag until issue #110 is fully wired.`

### 3. Award review and confirm gating

Now that the merged award read model exists:
- manager award UI should source readiness and blocker copy from `GET /v1/tasks/{taskId}/award`
- do not treat proof verification, shortlist ranking, or audit events alone as authority to show a winner summary when the award detail read is missing or stale
- `POST /v1/tasks/{taskId}/award` should stay disabled until the read model reports `READY_TO_AWARD` and includes the required shortlist/proof audit refs
- blocked states should stay explicit when the award detail says the task is not yet awardable or when issue [#110](https://github.com/jckhang/agent-indeed/issues/110) has not materialized the snapshot yet

Manager blocked-copy baseline:
- `Award is blocked until proof verification reaches a terminal pass state.`
- `Award summary is unavailable until the runtime award snapshot is populated.`
- `Winner details follow the merged award read model, not inferred shortlist or audit data.`

## Award detail is merged on main

Now that `GET /v1/tasks/{taskId}/award` exists on `main`:

- consume the merged award detail route instead of substituting `GET /v1/tasks/{taskId}/events`
- do not derive awarded state from verifier output, shortlist rank, or assumed audit events when the manager award read is unavailable
- if the current session knows proof verification is terminal but the runtime award snapshot is missing, keep the rail visible with `Award summary unavailable until the runtime award snapshot is populated`
- if the award detail reports a non-ready state, surface its `statusMessage` and keep the confirm path disabled until the backend snapshot becomes awardable

## Existing contract gaps to keep linked

Issue #116 should not invent new payloads when these gaps are already tracked elsewhere:

1. Runtime persistence and projection freshness for the merged bid/proof/award reads still belong to issue [#110](https://github.com/jckhang/agent-indeed/issues/110).
2. The first runnable frontend consumption path for those reads still belongs to issue [#136](https://github.com/jckhang/agent-indeed/issues/136).
3. Verifier result-code and proof-policy convergence still depend on PR [#83](https://github.com/jckhang/agent-indeed/pull/83), but that verifier surface remains operator/verifier-only until a frontend read model exists.

## Delivery guardrails for the next frontend implementation pass

When a runnable frontend app lands, the first runtime integration pass for issue #116 should:
1. replace fixture-only task publish confirmation with `POST /v1/tasks`
2. switch shortlist review to `GET /v1/tasks/{taskId}/candidates` and branch on `TASK_MATCH_NOT_READY`
3. preserve server-authored bid window state from commit/reveal responses
4. refresh proof/bid status through the merged `GET /v1/tasks/{taskId}/proofs/{proofId}` and `GET /v1/tasks/{taskId}/bids/{bidId}` routes while avoiding verifier-only endpoints from the manager/agent UI
5. drive the manager award rail from `GET /v1/tasks/{taskId}/award` and gate `POST /v1/tasks/{taskId}/award` on the returned readiness state instead of inferred frontend-only rules

## Acceptance criteria mapping

| Issue #116 acceptance | Coverage in this document |
| --- | --- |
| One end-to-end UI flow runs against local runtime APIs for all currently available endpoints. | The runtime-backed vertical slice and flow map bind each frontend route to the endpoints already present on `main`. |
| Missing endpoints render explicit blocked/pending states instead of silent placeholders. | `TASK_MATCH_NOT_READY`, stale verification projections, and non-ready award states each have required fallback behavior and copy. |
| Any frontend-backend contract mismatches are captured in linked issues with reproducible context. | Remaining gaps are linked directly to issue #110, issue #136, and PR #83 instead of being re-invented in frontend docs. |
| Progress and evidence are linked back to issue #110. | The doc links the runtime frontend slice directly to runtime backend issue #110 as the paired vertical-flow dependency. |
