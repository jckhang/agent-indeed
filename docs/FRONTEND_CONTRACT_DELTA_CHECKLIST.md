# Frontend Contract Delta Checklist (P1-31)

Last updated: 2026-03-16

Related issue: [#99](https://github.com/jckhang/agent-indeed/issues/99)

Input references:
- PR [#95](https://github.com/jckhang/agent-indeed/pull/95) frontend data-gap notes
- `docs/MANAGER_SHORTLIST_REVIEW_AWARD_READINESS_UI_SLICE.md`
- `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md`
- `docs/FRONTEND_MVP_SURFACE.md`

## Objective

Turn the frontend data-gap notes into one backend-facing checklist that reviewers can use without rereading every frontend slice document.

Guardrails:
- Only call out fields and behaviors that already exist in the active contract PRs or current baseline docs.
- Mark anything that should stay blocked on upstream contract merge as an accepted risk instead of inventing a frontend-only payload.
- Keep manager shortlist/award and agent verification/status-refresh follow-ups in one owner-grouped list.

## Highest-priority deltas

1. PR [#68](https://github.com/jckhang/agent-indeed/pull/68) must land before manager shortlist and award-readiness UI can move past dependency copy.
2. PR [#66](https://github.com/jckhang/agent-indeed/pull/66) must land before the agent verification route can promise refresh-safe queued or verifying progress.
3. PR [#83](https://github.com/jckhang/agent-indeed/pull/83) must stay aligned with PR [#66](https://github.com/jckhang/agent-indeed/pull/66) so terminal proof copy uses the same reason-code and trace vocabulary after polling.
4. PR [#92](https://github.com/jckhang/agent-indeed/pull/92) closes the audit drill-in gap, but it should not be treated as a prerequisite for the manager shortlist shell itself.
5. PR [#55](https://github.com/jckhang/agent-indeed/pull/55) remains the ranking baseline dependency that feeds PR [#68](https://github.com/jckhang/agent-indeed/pull/68); its fields should not drift while shortlist review stays in flight.

## Owner-grouped checklist

| Upstream owner | Frontend surface | Concrete contract delta or accepted risk | Why it blocks or shapes FE work |
| --- | --- | --- | --- |
| PR [#68](https://github.com/jckhang/agent-indeed/pull/68) shortlist + award read-model owner | Manager shortlist table and detail panel | Confirm `GET /v1/tasks/{taskId}/candidates` returns `agentId`, `bidId`, `identityTier`, `hardFilterPassed`, `eligibilityStatus`, `rankingScore`, optional `scoreBreakdown`, `missingDataStates`, `proofReadiness`, `shortlistAuditId`, and `decisionTraceHash`. | P1-20 depends on these fields to render ranked rows, missing-data fallback chips, proof-readiness badges, and shortlist trace links without hiding partially populated candidates. |
| PR [#68](https://github.com/jckhang/agent-indeed/pull/68) shortlist + award read-model owner | Manager award-readiness rail | Confirm `GET /v1/tasks/{taskId}/award` exposes `status`, `statusMessage`, `awardedBidId`, `awardedAgentId`, `proofSummary`, `decisionTraceHash`, `auditEventId`, and `handoff.*`. | The award rail needs one manager-readable readiness source; otherwise the UI falls back to generic blocker copy and cannot distinguish review-ready from already-awarded or pending-contract states. |
| PR [#68](https://github.com/jckhang/agent-indeed/pull/68) shortlist + award read-model owner | Award CTA state | Accepted risk: keep the manager `Award task` CTA disabled until both the award read model and `POST /v1/tasks/{taskId}/award` are on `main`; do not infer that a visible winner summary means the write path is ready. | Prevents the shortlist shell from implying interactive award support before the command and handoff contract are actually merged. |
| PR [#66](https://github.com/jckhang/agent-indeed/pull/66) bid/proof status-read owner | Agent verification route and bid workspace resume | Confirm `GET /v1/tasks/{taskId}/bids/{bidId}` and `GET /v1/tasks/{taskId}/proofs/{proofId}` stay the refresh-safe source for `commitState`, `revealState`, `proofState`, `awardState`, `requiredDifficulty`, `achievedDifficulty`, `reasonCodes`, `decisionTraceHash`, and `refresh.mode`, `pollAfterSeconds`, `manualRefreshAllowed`, `lastUpdatedAt`. | P1-21 and P1-22 need one honest polling model after reveal submit; without it, queued and verifying states remain dependency notes rather than reload-safe UI states. |
| PR [#66](https://github.com/jckhang/agent-indeed/pull/66) bid/proof status-read owner | Agent verification refresh policy | Accepted risk: until the read endpoints merge, the post-reveal success screen may only hand off with `proofSubmission.proofId` and `verificationStatus=PENDING_VERIFY`; it must not promise live status recovery after refresh. | Keeps frontend copy aligned with current `main` instead of fabricating a timeline from write responses alone. |
| PR [#83](https://github.com/jckhang/agent-indeed/pull/83) verifier contract owner | Terminal proof summary copy | Keep `ProofVerificationResponse` and reveal success payload vocabulary aligned on `verificationStatus`, `decisionTraceHash`, `reasonCodes`, `requiredDifficulty`, and `achievedDifficulty`. | Agent, manager, and operator views need the same proof-result nouns once polling returns a terminal decision; otherwise failure messaging drifts across surfaces. |
| PR [#83](https://github.com/jckhang/agent-indeed/pull/83) verifier contract owner | Immediate reveal confirmation | Accepted risk: before PR [#66](https://github.com/jckhang/agent-indeed/pull/66) merges, terminal verification details from PR [#83](https://github.com/jckhang/agent-indeed/pull/83) should stay out of refresh-safe UI promises and remain limited to post-submit handoff copy. | Avoids implying that proof verification is already queryable when the read contract is still separate work. |
| PR [#92](https://github.com/jckhang/agent-indeed/pull/92) audit event-stream owner | Manager and operator audit drill-in | Confirm `GET /v1/tasks/{taskId}/events` and `GET /v1/bids/{bidId}/events` expose `eventType`, `eventId`, `actorRole`, `actorId`, `taskId`, `bidId`, `proofId`, `auditId`, `traceHash`, `summary`, `occurredAt`, and `completeness`. | Award review and audit timeline links need a durable event read path so users can inspect trace context instead of relying on raw logs or inferred history. |
| PR [#92](https://github.com/jckhang/agent-indeed/pull/92) audit event-stream owner | Award trace fallback | Confirm `TASK_AWARDED` event payloads carry `decisionTraceHash`, score summary, proof summary, and completeness markers that match the award-read shell. | Lets manager and operator views distinguish "field intentionally absent" from "audit write missing" when the award outcome is under review. |
| PR [#55](https://github.com/jckhang/agent-indeed/pull/55) shortlist ranking baseline owner | Ranking chips and shortlist fallback copy | Keep shortlist ranking baseline fields aligned with PR [#68](https://github.com/jckhang/agent-indeed/pull/68): `hardFilterPassed`, `rankingScore`, and optional `scoreBreakdown` must remain the canonical ranking inputs. | The shortlist shell should inherit one scoring vocabulary instead of maintaining separate frontend assumptions for baseline matching versus manager review. |
| PR [#55](https://github.com/jckhang/agent-indeed/pull/55) shortlist ranking baseline owner | Missing ranking detail behavior | Accepted risk: if `scoreBreakdown` is absent, the UI should continue rendering shortlist rows and show `Pending backend score breakdown` rather than suppressing candidates or inventing zero values. | Keeps shortlist review usable while score detail remains partial and avoids converting incomplete ranking data into false certainty. |

## Merge-order notes for reviewers

- Merge PR [#68](https://github.com/jckhang/agent-indeed/pull/68) before treating manager shortlist or award-readiness acceptance criteria as contract-complete.
- Merge PR [#66](https://github.com/jckhang/agent-indeed/pull/66) before treating agent verification polling or browser-refresh recovery as shippable.
- Keep PR [#83](https://github.com/jckhang/agent-indeed/pull/83) and PR [#66](https://github.com/jckhang/agent-indeed/pull/66) synchronized on proof result fields so queued-to-terminal transitions do not fork.
- Use PR [#92](https://github.com/jckhang/agent-indeed/pull/92) to answer audit drill-in questions, not to backfill the manager award shell with ad hoc event parsing.
- Treat PR [#55](https://github.com/jckhang/agent-indeed/pull/55) as the ranking baseline; any shortlist-review change that renames or drops those fields should be called out before merge.
