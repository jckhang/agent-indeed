# Frontend Runtime Dispatch Wiring Target (Week of 2026-03-16)

Last updated: 2026-03-16

Related issue: [#116](https://github.com/jckhang/agent-indeed/issues/116)
Related runtime backend slice: [#110](https://github.com/jckhang/agent-indeed/issues/110)

## Objective

Define one frontend runtime-backed dispatch loop that uses the contracts already present on `main` and stays explicit about the remaining read-model gaps.

This target keeps the UI honest in the current repo state:
- task publish, candidate shortlist, bid commit, bid reveal, proof verify, and task audit timeline contracts already exist in `src/api/openapi.yaml`
- proof-status reads and award-summary reads still do not exist as dedicated frontend-facing endpoints on `main`
- the frontend should wire available endpoints now and render blocked or pending states for everything else instead of falling back to silent placeholders

## Runtime-backed vertical slice

The runtime slice for this week is:
`publish -> match -> commit -> reveal -> verify-status -> award-read`

Bounded interpretation for the current contract stack:
- `publish`: `POST /v1/tasks`
- `match`: `GET /v1/tasks/{taskId}/candidates`
- `commit`: `POST /v1/tasks/{taskId}/bids/commit`
- `reveal`: `POST /v1/tasks/{taskId}/bids/reveal`
- `verify-status`: immediate verifier result from `POST /v1/tasks/{taskId}/proofs/verify`, plus explicit pending fallback when no read model exists yet
- `award-read`: reconstruct winner readiness and awarded outcome from `GET /v1/tasks/{taskId}/events` until a dedicated award read endpoint lands

## Flow contract map

| Flow step | Primary route | Runtime endpoint | Current frontend behavior target |
| --- | --- | --- | --- |
| Publish task | `/manager/tasks/new` | `POST /v1/tasks` | Submit real `TaskSpec`, keep returned `taskId`, and transition into matching review instead of fixture-only confirmation. |
| Match candidates | `/manager/tasks/{taskId}/review` | `GET /v1/tasks/{taskId}/candidates` | Render ranked and ineligible rows from the live shortlist response, including `matchingTraceId`, eligibility gates, and optional `scoreBreakdown`. |
| Commit bid | `/agent/tasks/{taskId}/bid-workspace` | `POST /v1/tasks/{taskId}/bids/commit` | Use the server-authored `window` snapshot to drive next-step copy and disable local deadline guessing. |
| Reveal bid | `/agent/tasks/{taskId}/bid-workspace` | `POST /v1/tasks/{taskId}/bids/reveal` | Keep `proofSubmission.proofId`, `verificationStatus`, `rankingScore`, and `decisionTraceHash` as the only durable post-reveal fields. |
| Verification status | `/agent/tasks/{taskId}/verification` | `POST /v1/tasks/{taskId}/proofs/verify` today; dedicated read still missing | Show terminal verifier output when the current session owns it; otherwise keep a pending state with a contract-gap note instead of fabricating queued or refreshed status. |
| Award read | `/manager/tasks/{taskId}/award` | `GET /v1/tasks/{taskId}/events` | Derive award-readiness or awarded history from audit events until issue [#58](https://github.com/jckhang/agent-indeed/issues/58) adds a winner-focused read model. |

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

When reveal succeeds but the frontend does not yet own a terminal proof result:
- treat `proofSubmission.verificationStatus=PENDING_VERIFY` as the only durable pending state on `main`
- do not imply that a browser refresh can recover live status until issue [#59](https://github.com/jckhang/agent-indeed/issues/59) lands
- keep the verification route visible, but annotate it as pending runtime follow-through

Agent copy baseline:
- Primary: `Proof submitted. Verification is pending.`
- Supporting: `Live status refresh still depends on the bid/proof read contract.`

### 3. Blocked award actions

Until a dedicated award read/write surface is merged:
- manager award UI should treat audit timeline data as read-only evidence, not as permission to trigger an award command
- `TASK_AWARDED` in the audit stream means the task is already terminal
- missing `TASK_AWARDED` does not mean award is ready; the UI still needs proof success and a real award read model
- blocked states should stay explicit even when shortlist data exists

Manager blocked-copy baseline:
- `Award is blocked until proof verification reaches a terminal pass state.`
- `Award summary is read-only on the current contract baseline.`
- `Winner details come from audit events for now; award command support is still pending.`

## Award-read via audit timeline

Until `GET /v1/tasks/{taskId}/award` exists, the manager runtime slice should read these audit facts from `GET /v1/tasks/{taskId}/events`:

| Audit event | Frontend meaning | Notes |
| --- | --- | --- |
| `TASK_CREATED` | Task exists and entered the runtime flow | Use to restore task status and risk/policy summary. |
| `BID_COMMITTED` | Candidate locked a bid hash | Useful for progress chronology, not for award readiness by itself. |
| `BID_REVEALED` | Candidate reveal + proof submission completed | `decisionTraceHash` becomes available for shortlist detail and later award evidence. |
| `POMW_VERIFIED` | Proof reached a terminal verifier decision | `result`, `reasonCodes`, and `manualReviewRequired` drive award-blocked copy. |
| `TASK_AWARDED` | Task has reached an awarded or closed-no-award terminal state | Treat as the temporary award-read source until a dedicated read model lands. |

Minimum award-read derivation rules:
- if no `POMW_VERIFIED` event exists for the leading bid, render `Award blocked: verification still pending`
- if the latest proof result is `FAIL` or `MANUAL_REVIEW`, render `Award blocked` with the returned reason codes
- if a `TASK_AWARDED` event exists, render the awarded agent, bid, and `decisionTraceHash` from the audit payload
- if shortlist data exists but audit evidence is incomplete, keep the rail visible with `Audit evidence still incomplete` rather than hiding the state

## Existing contract gaps to keep linked

Issue #116 should not invent new payloads when these gaps are already tracked elsewhere:

1. Proof status read and refresh durability still belong to issue [#59](https://github.com/jckhang/agent-indeed/issues/59) / PR [#66](https://github.com/jckhang/agent-indeed/pull/66).
2. Manager winner and award summary reads still belong to issue [#58](https://github.com/jckhang/agent-indeed/issues/58) / PR [#68](https://github.com/jckhang/agent-indeed/pull/68).
3. Verifier result-code and proof-policy convergence still depend on PR [#83](https://github.com/jckhang/agent-indeed/pull/83).

## Delivery guardrails for the next frontend implementation pass

When a runnable frontend app lands, the first runtime integration pass for issue #116 should:
1. replace fixture-only task publish confirmation with `POST /v1/tasks`
2. switch shortlist review to `GET /v1/tasks/{taskId}/candidates` and branch on `TASK_MATCH_NOT_READY`
3. preserve server-authored bid window state from commit/reveal responses
4. show `PENDING_VERIFY` and terminal verifier results without promising refresh-safe recovery that the backend cannot yet support
5. use the task audit timeline as the temporary award-read surface until issue #58 merges

## Acceptance criteria mapping

| Issue #116 acceptance | Coverage in this document |
| --- | --- |
| One end-to-end UI flow runs against local runtime APIs for all currently available endpoints. | The runtime-backed vertical slice and flow map bind each frontend route to the endpoints already present on `main`. |
| Missing endpoints render explicit blocked/pending states instead of silent placeholders. | `TASK_MATCH_NOT_READY`, verification pending, and blocked award actions each have required fallback behavior and copy. |
| Any frontend-backend contract mismatches are captured in linked issues with reproducible context. | Existing gaps are linked directly to issues #58 and #59 plus PR #83 instead of being re-invented in frontend docs. |
| Progress and evidence are linked back to issue #110. | The doc links the runtime frontend slice directly to runtime backend issue #110 as the paired vertical-flow dependency. |
