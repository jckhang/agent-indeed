# Frontend Runtime Dispatch Wiring Target (Week of 2026-03-16)

Last updated: 2026-03-16

Related issue: [#116](https://github.com/jckhang/agent-indeed/issues/116)
Related runtime backend slice: [#110](https://github.com/jckhang/agent-indeed/issues/110)

## Objective

Define one frontend runtime-backed dispatch loop that uses the contracts already present on `main` and stays explicit about the remaining read-model gaps.

This target keeps the UI honest in the current repo state:
- task publish, candidate shortlist, bid commit, bid reveal, and proof verify contracts already exist in `src/api/openapi.yaml`
- proof-status reads, award-summary reads, and any frontend-consumable audit timeline read for this flow still do not exist as merged endpoints on `main`
- the frontend should wire only the published endpoints now and render blocked or pending states for everything else instead of falling back to silent placeholders

## Runtime-backed vertical slice

The runtime slice for this week is:
`publish -> match -> commit -> reveal -> pending-verify -> award-read`

Bounded interpretation for the current contract stack:
- `publish`: `POST /v1/tasks`
- `match`: `GET /v1/tasks/{taskId}/candidates`
- `commit`: `POST /v1/tasks/{taskId}/bids/commit`
- `reveal`: `POST /v1/tasks/{taskId}/bids/reveal`
- `pending-verify`: stay on the reveal response's `proofSubmission.verificationStatus` and keep the UI at `PENDING_VERIFY` until open PR [#66](https://github.com/jckhang/agent-indeed/pull/66) lands a frontend-readable status model
- `award-read`: keep the manager award surface explicitly blocked until open PR [#68](https://github.com/jckhang/agent-indeed/pull/68) lands a dedicated read model

## Flow contract map

| Flow step | Primary route | Runtime endpoint | Current frontend behavior target |
| --- | --- | --- | --- |
| Publish task | `/manager/tasks/new` | `POST /v1/tasks` | Submit real `TaskSpec`, keep returned `taskId`, and transition into matching review instead of fixture-only confirmation. |
| Match candidates | `/manager/tasks/{taskId}/review` | `GET /v1/tasks/{taskId}/candidates` | Render ranked and ineligible rows from the live shortlist response, including `matchingTraceId`, eligibility gates, and optional `scoreBreakdown`. |
| Commit bid | `/agent/tasks/{taskId}/bid-workspace` | `POST /v1/tasks/{taskId}/bids/commit` | Use the server-authored `window` snapshot to drive next-step copy and disable local deadline guessing. |
| Reveal bid | `/agent/tasks/{taskId}/bid-workspace` | `POST /v1/tasks/{taskId}/bids/reveal` | Keep `proofSubmission.proofId`, `verificationStatus`, `rankingScore`, and `decisionTraceHash` as the only durable post-reveal fields. |
| Verification status | `/agent/tasks/{taskId}/verification` | No merged frontend-readable endpoint on `main`; use reveal response only | Keep `proofSubmission.verificationStatus=PENDING_VERIFY` as the durable UI state and explain that verifier-owned terminal results are not yet queryable from the manager/agent frontend flow. |
| Award read | `/manager/tasks/{taskId}/award` | No merged endpoint on `main` | Keep the rail visible with explicit blocked copy, and link open PR [#68](https://github.com/jckhang/agent-indeed/pull/68) until a winner-focused read model lands. |

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

### 2. Verification pending

When reveal succeeds:
- treat `proofSubmission.verificationStatus=PENDING_VERIFY` as the only durable pending state on `main`
- do not call `POST /v1/tasks/{taskId}/proofs/verify` from the manager or agent UI flow; that endpoint is verifier/operator scope only on the current contract baseline
- do not imply that a browser refresh can recover live status until PR [#66](https://github.com/jckhang/agent-indeed/pull/66) lands
- keep the verification route visible, but annotate it as pending runtime follow-through

Agent copy baseline:
- Primary: `Proof submitted. Verification is pending.`
- Supporting: `Live status refresh still depends on the bid/proof read contract; verifier-only checks do not unblock the frontend flow yet.`

### 3. Blocked award actions

Until a dedicated award read/write surface is merged:
- manager award UI should stay explicitly blocked even when shortlist and reveal data are present
- do not treat proof verification, shortlist ranking, or unpublished audit endpoints as authority to show a winner summary
- proof success in the current session may unlock clearer copy, but it still does not create a merged award-read contract
- blocked states should stay explicit even when shortlist data exists

Manager blocked-copy baseline:
- `Award is blocked until proof verification reaches a terminal pass state.`
- `Award summary is unavailable on the current contract baseline.`
- `Winner details stay blocked until the shortlist and award read model lands.`

## Award-read stays blocked on main

Until `GET /v1/tasks/{taskId}/award` or an equivalent merged read model exists:

- do not call or document `GET /v1/tasks/{taskId}/events` as a manager award-read dependency for issue #116
- do not derive awarded state from verifier output, shortlist rank, or assumed audit events
- if the current session knows proof verification is terminal, keep the award rail visible with `Award summary unavailable until the dedicated read model lands`
- if verification is still pending, keep the stronger blocker copy and link open PR [#68](https://github.com/jckhang/agent-indeed/pull/68) as the owning follow-up

## Existing contract gaps to keep linked

Issue #116 should not invent new payloads when these gaps are already tracked elsewhere:

1. Proof status read and refresh durability still belong to open PR [#66](https://github.com/jckhang/agent-indeed/pull/66).
2. Manager winner and award summary reads still belong to open PR [#68](https://github.com/jckhang/agent-indeed/pull/68).
3. Verifier result-code and proof-policy convergence still depend on PR [#83](https://github.com/jckhang/agent-indeed/pull/83), but that verifier surface remains operator/verifier-only until a frontend read model exists.

## Delivery guardrails for the next frontend implementation pass

When a runnable frontend app lands, the first runtime integration pass for issue #116 should:
1. replace fixture-only task publish confirmation with `POST /v1/tasks`
2. switch shortlist review to `GET /v1/tasks/{taskId}/candidates` and branch on `TASK_MATCH_NOT_READY`
3. preserve server-authored bid window state from commit/reveal responses
4. show only the reveal response's `PENDING_VERIFY` state and avoid calling verifier-only endpoints from the manager/agent UI
5. keep award-read explicitly blocked until PR #68 merges a dedicated read model

## Acceptance criteria mapping

| Issue #116 acceptance | Coverage in this document |
| --- | --- |
| One end-to-end UI flow runs against local runtime APIs for all currently available endpoints. | The runtime-backed vertical slice and flow map bind each frontend route to the endpoints already present on `main`. |
| Missing endpoints render explicit blocked/pending states instead of silent placeholders. | `TASK_MATCH_NOT_READY`, verification pending, and blocked award actions each have required fallback behavior and copy. |
| Any frontend-backend contract mismatches are captured in linked issues with reproducible context. | Existing gaps are linked directly to open PRs #68 and #66 plus PR #83 instead of being re-invented in frontend docs. |
| Progress and evidence are linked back to issue #110. | The doc links the runtime frontend slice directly to runtime backend issue #110 as the paired vertical-flow dependency. |
