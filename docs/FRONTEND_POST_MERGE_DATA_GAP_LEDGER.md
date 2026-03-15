# Frontend Post-Merge Data Gap Ledger (P1-30)

Last updated: 2026-03-15

Related issue: [#94](https://github.com/jckhang/agent-indeed/issues/94)

## Objective

Capture the remaining frontend data gaps after the focused manager and agent UI slices merged, so the next review cycle stays anchored to real contract blockers instead of drifting into ad hoc payload guesses.

This ledger compares:
- merged manager and agent UI slices from PR [#76](https://github.com/jckhang/agent-indeed/pull/76) and PR [#78](https://github.com/jckhang/agent-indeed/pull/78)
- open backend/frontend dependency PRs [#68](https://github.com/jckhang/agent-indeed/pull/68), [#73](https://github.com/jckhang/agent-indeed/pull/73), and [#83](https://github.com/jckhang/agent-indeed/pull/83)
- the current planning baseline in `docs/FRONTEND_MVP_SURFACE.md`

## Source baseline after merges

| Surface | Merged or active source | What is already defined |
| --- | --- | --- |
| Manager shortlist and award-readiness review | merged PR `#78`, `docs/MANAGER_SHORTLIST_REVIEW_AWARD_READINESS_UI_SLICE.md` | Review shell, partial-data shortlist behavior, and award blocker UX |
| Agent commit/reveal workspace | merged PR `#76`, `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md` | Unified commit/reveal workflow, window handling, and proof-pack validation |
| Agent verification timeline | open PR `#73`, `docs/AGENT_VERIFICATION_TIMELINE_BASELINE.md` | Post-reveal verification states and refresh assumptions |
| Manager shortlist/award contracts | open PR `#68` | Candidate read model, award summary/readiness payloads, and award handoff write path |
| Proof verifier contract | open PR `#83` | Canonical verification result shape, reason codes, and policy-trace fields |

## Remaining frontend data gaps

| Gap area | Why the merged UI still cannot finalize behavior on `main` | Required fields or states | Current dependency |
| --- | --- | --- | --- |
| Award-review shortlist freshness | Manager review needs to show whether the shortlist snapshot is stale or still generating | `shortlistGeneratedAt` or equivalent freshness field, plus candidate-count completeness signal | issue `#58` / PR `#68` |
| Partial ranking evidence | Manager rows stay visible with missing score dimensions, but the API still needs to distinguish missing evidence from zero scores | `scoreBreakdown`, `missingDataStates`, `hardFilterPassed`, `proofReadiness` | issue `#58` / PR `#68` |
| Award-readiness blocker model | Manager UI has blocker copy, but cannot safely decide when award is actionable without a typed readiness payload | `readiness`, `blockingReasons[]`, `recommendedBidId`, `proofSummary`, `decisionTraceHash`, `auditEventId` | issue `#58` / PR `#68` |
| Verification restore-after-refresh | The merged bid workspace can hand off after reveal, but it still cannot recover long-running verification after browser refresh or cross-device resume | task-scoped bid/proof read payload with `phase`, `status`, `proofId`, `window`, and latest verification snapshot | issue `#59` / PR `#66` plus PR `#73` |
| Verification result vocabulary | Timeline and review docs must keep one enum set across frontend docs, OpenAPI, and TS contracts | stable terminal result values, manual-review semantics, and reason-code catalog | issue `#9` / PR `#83` |
| Failure-copy mapping | The merged slices define blocked/error shells, but frontend copy still depends on which verifier and shortlist reasons become first-class backend fields | shortlist blocker list, verification `reasonCodes`, operator/manual-review hints | PR `#68`, PR `#73`, PR `#83` |
| Audit-link completeness for manager review | Manager review can point to downstream audit visibility, but cannot prove whether missing audit references mean "not emitted yet" or "not returned" | explicit audit reference fields or completeness markers on shortlist/award payloads | issue `#58` / PR `#68`, issue `#10` |

## Verify follow-through gaps

### Data still missing

- A refresh-safe bid/proof read model that returns the latest task phase, proof status, and server-authored window snapshot.
- Canonical verification result literals and reason codes that match the verifier contract instead of frontend-only wording.
- A clear manual-review handoff shape so the timeline can distinguish `needs operator action` from `still processing`.

### Loading and fallback states the UI must preserve

| Situation | UX behavior that should stay explicit |
| --- | --- |
| Reveal just succeeded, but no read endpoint exists yet | Show immediate post-submit result and warn that refresh-safe progress tracking still depends on issue `#59` / PR `#66`. |
| Verification is queued or still running | Show `Waiting for verification snapshot` rather than inventing timestamps or terminal outcomes. |
| Result vocabulary is drifting across docs/contracts | Normalize to the current shared contract vocabulary and point to PR `#83` as the contract source of truth. |
| Reason codes are absent | Render `Reason codes pending verifier contract` rather than collapsing to a generic success/failure timeline. |

### Failure-state copy still needed

- `Verification is still running for this proof. Refresh-safe status reads are not merged yet.`
- `Verification returned a failure outcome, but detailed reason codes are still pending the verifier contract follow-up.`
- `This proof needs manual review. Operator handoff fields are still limited until the verifier and audit contracts land.`

## Award-review follow-through gaps

### Data still missing

- Ranked candidate rows need a durable freshness marker plus explicit `missingDataStates` so the manager can tell `still computing` apart from `no supporting evidence`.
- Award-readiness needs a typed blocker list and a recommended-candidate summary that can survive partial proof or audit data.
- The manager surface still needs explicit audit linkage fields before it can hand off cleanly to the audit timeline.

### Loading and fallback states the UI must preserve

| Situation | UX behavior that should stay explicit |
| --- | --- |
| Shortlist request is loading | Keep task summary visible and use skeleton rows instead of placeholder rankings. |
| Shortlist is partial | Keep all candidate rows visible and badge missing score or proof evidence. |
| Award payload is missing blocker fields | Show `Award readiness is partially visible; contract follow-up is still in review.` |
| No awardable candidate exists yet | Explain whether the blocker is task phase, proof status, or missing shortlist evidence. |

### Failure-state copy still needed

- `Award stays blocked until shortlist and verification settle.`
- `Verification detail pending; this candidate stays visible but is not award-ready yet.`
- `Audit reference pending contract merge; review can continue, but final trace linkage is not available yet.`

## Handoff map for the next review cycle

| Frontend concern | Backend/frontend owner path | What to review next |
| --- | --- | --- |
| Manager shortlist data completeness | issue `#58` / PR `#68` | Candidate row fields, blocker payload, audit refs |
| Verification refresh and resume | issue `#59` / PR `#66` | Bid/proof read model and server-authored window snapshot |
| Verification result vocabulary and reason codes | issue `#9` / PR `#83` | Canonical result enums, reason-code catalog, manual-review semantics |
| Timeline copy and dependency honesty | issue `#64` / PR `#73` | Verification state wording after verifier/status-read contracts settle |

## Acceptance criteria mapping

| Acceptance criterion | How this ledger satisfies it |
| --- | --- |
| Remaining frontend dependencies are written down in one place. | This document consolidates the post-merge manager and agent data gaps into a single review ledger. |
| Each dependency is mapped to the owning backend/frontend issue or PR. | Every gap row and handoff item points to issue `#58`, issue `#59`, issue `#64`, issue `#9`, or the matching open PR. |
| Missing fields, loading states, and failure-state copy are explicit for verify and award review. | Separate verify and award sections list the concrete fields, fallback behavior, and copy that must remain visible until the contracts land. |
