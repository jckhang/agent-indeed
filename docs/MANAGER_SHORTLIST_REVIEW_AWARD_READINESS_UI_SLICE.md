# Manager Shortlist Review and Award-Readiness UI Slice (P1-20)

Last updated: 2026-03-18

Related issue: [#62](https://github.com/jckhang/agent-indeed/issues/62)

## Objective

Define the manager-side shortlist review and award-readiness slice that starts after task creation, so candidate inspection and award gating can be reviewed independently from publish-form work.

This slice stays explicit about current repo reality:
- `docs/MANAGER_CONSOLE_BASELINE.md` already captures the broader manager baseline.
- the published API drafts on `main` include `GET /v1/tasks/{taskId}/candidates` -> `CandidateMatchListResponse` and `GET /v1/tasks/{taskId}/award` -> `AwardDecisionDetail`; treat `src/api/openapi.yaml:355`, `src/api/openapi.yaml:522`, `src/api/contracts.ts:539`, and `src/api/contracts.ts:759` as the source-of-truth anchors when reviewing this slice.
- `POST /v1/tasks/{taskId}/award` is contract-ready on `main`, but live runtime execution still depends on the runnable dispatch implementation from issue [#110](https://github.com/jckhang/agent-indeed/issues/110).
- The UI must remain fallback-first for missing runtime data or unavailable handlers; it should not invent hidden fields or pretend local environments are more complete than the running stack actually is.

Related planning context:
- `docs/FRONTEND_MVP_SURFACE.md`
- `docs/FRONTEND_RUNTIME_INTEGRATION_TRANCHE.md`
- issue [#43](https://github.com/jckhang/agent-indeed/issues/43) for the original manager console baseline
- issue [#58](https://github.com/jckhang/agent-indeed/issues/58) for shortlist and award contract follow-through

## Scope

In scope:
- A task-scoped manager review shell that starts after a task has already been published.
- Candidate shortlist rendering with score breakdown, missing-data fallbacks, and loading/empty/error states.
- Award-readiness visibility that explains whether the current task can move to award and why.
- Dependency callouts that point back to the backend contract work instead of hiding unsupported states.

Out of scope:
- Task creation form behavior.
- Final award decision execution details beyond the readiness handoff.
- Operator audit timeline and proof override flows.
- Matching algorithm changes or backend payload invention.

## Review shell model

Route suggestion:
- `/manager/tasks/{taskId}/review`

If the existing route split remains, the same shell can back both:
- `/manager/tasks/{taskId}/candidates`
- `/manager/tasks/{taskId}/award`

The shell should always keep three elements visible:
- `Task summary`: task id, current task state, shortlist freshness timestamp, and the current top-candidate status.
- `Candidate shortlist`: ranked table plus a detail panel for the selected candidate.
- `Award-readiness rail`: readiness state, blockers, and dependency notes without forcing the manager into an unsupported write flow.

## Primary workflow

| Step | Manager intent | UI behavior | Contract dependency |
| --- | --- | --- | --- |
| 1 | Open review after publish | Restore task summary and fetch shortlist/award-readiness data | merged shortlist + award reads on `main` |
| 2 | Understand ranking quality | Show ranked candidates, score breakdown, and missing-data states without collapsing rows | shortlist read model |
| 3 | Inspect a candidate | Expand proof status, trace refs, and blocker explanation for one candidate | shortlist detail fields |
| 4 | Check whether award is possible | Render readiness state, current blockers, and follow-up dependency notes | award summary read model |
| 5 | Hand off to award action only when supported | Keep CTA disabled or secondary when runtime handlers are absent or blocked in the current environment | award command contract + issue `#110` runtime wiring |

## Shortlist review surface

### Summary strip

Render:
- `taskId`
- task state
- shortlist freshness timestamp
- candidate count
- selected-candidate status summary

Behavior:
- Freshness should be visible because shortlist quality is time-sensitive during matching and verification.
- If no shortlist timestamp is available, show `Waiting for shortlist snapshot` instead of fabricating recency.

### Candidate table

Columns:
- rank
- agent id
- identity tier
- hard-filter outcome
- total ranking score
- score breakdown chips (`success`, `latency`, `budget`, `similarity`) when present
- proof readiness
- missing-data warnings

Behavior:
- Rows stay visible even when some ranking dimensions are missing.
- Missing score dimensions should render `Pending backend score breakdown`.
- If a candidate is not awardable yet, show the current blocker inline instead of removing the candidate from the shortlist.

### Candidate detail panel

Render for the selected row:
- agent id
- shortlist audit reference when present
- `decisionTraceHash` when present
- proof status / verification outcome
- missing-field summary
- explanation of whether this candidate is currently awardable

Fallback behavior:
- Missing proof summary: render `Verification detail pending`.
- Missing shortlist audit id: render `Audit reference pending runtime materialization`.
- Missing decision trace: keep the candidate visible and note that trace linkage is not yet returned.

## Loading, empty, and error states

| State | UX treatment |
| --- | --- |
| Loading shortlist | Show table skeleton plus task header; avoid fake candidate counts. |
| Empty shortlist | Explain whether no candidates matched or shortlist generation has not completed yet. |
| Partial shortlist | Keep rows visible and badge missing dimensions or pending proof data. |
| API error / runtime unavailable | Show task id, surfaced error text, and a dependency note pointing to issue #58 or issue #110 instead of generic failure copy. |

## Award-readiness rail

### Sections

- `Task state`: current lifecycle stage and whether award review is informational or actionable
- `Recommended candidate`: top available candidate id, ranking score, proof readiness, and trace references when present
- `Readiness`: `ready`, `blocked`, `already_awarded`, or `pending_contract`
- `Blocking reasons`: manager-readable explanation of what must happen next
- `Dependency callouts`: explicit note when the UI is waiting on shortlist/award contract support rather than task state alone

### Blocking-state mapping

| Condition | Manager copy |
| --- | --- |
| Task still matching or bidding | `Award stays blocked until shortlist and verification settle.` |
| Candidate proof still pending | `Proof verification is still running for the leading candidate.` |
| Candidate proof failed | `Top-ranked candidate is not award-ready; review the next eligible candidate.` |
| No eligible candidate | `No awardable candidate is available yet.` |
| Award summary fields missing from backend | `Award readiness is partially visible; contract follow-up is still in review.` |
| Task already awarded | `Award is complete; use the audit timeline for final trace details.` |

### CTA behavior

- Default CTA label: `Award task`
- Disable the CTA when readiness is not `ready`.
- When the award command contract is still pending on the checked-out baseline, show a non-primary helper note instead of implying the button can complete the flow.
- Preserve blocker copy even when the task becomes terminal so managers can understand why no further action is offered.

## API-to-UI mapping

| Review shell surface | Contract/input | Status on `main` | Notes |
| --- | --- | --- | --- |
| Task summary | task state + shortlist freshness | Partial | State exists today; freshness still depends on shortlist read support. |
| Candidate shortlist table | `GET /v1/tasks/{taskId}/candidates` | Ready | Render `TASK_MATCH_NOT_READY` as a retryable shortlist-loading state, not as an empty result. |
| Candidate detail panel | shortlist audit refs + proof readiness + `decisionTraceHash` | Ready | Missing optional fields should become explicit fallback copy, not hidden UI branches. |
| Award-readiness rail | `GET /v1/tasks/{taskId}/award` | Ready | Use `status`, `statusMessage`, `proofSummary`, `handoff`, and trace fields directly from the merged read model. |
| Award handoff CTA | `POST /v1/tasks/{taskId}/award` | Contract-ready | Keep the call-to-action disabled or secondary when the current runtime stack does not yet execute the write path. |

The shortlist and award-readiness rows above refer to the published contract anchors on `main`; local runtime behavior can still lag until issue [#110](https://github.com/jckhang/agent-indeed/issues/110) serves the same shapes consistently.

## Backend dependency feedback

P1-20 keeps three runtime-consumer gaps explicit instead of burying them inside frontend assumptions:

1. Shortlist freshness and retry semantics still need to stay stable in the running stack.
   - Minimum UI-safe fields already exist on `main`: ranked rows, hard-filter outcome, score breakdown, proof readiness, shortlist freshness metadata, and `TASK_MATCH_NOT_READY` as a retryable loading path.
2. Award-readiness reads must stay the source of truth for blockers.
   - Use `status`, `statusMessage`, `proofSummary`, `handoff`, and decision/audit references from the merged read model instead of reconstructing award readiness in the client.
3. Award command support must remain distinguishable from award-readiness visibility.
   - The UI should not infer that a visible winner summary means the current local runtime already executes the award write path successfully.

These gaps should stay tied to issue #58, issue #110, and downstream audit work, not copied into ad hoc frontend-only payload guesses.

## Residual follow-ups on the current baseline

After the shortlist and award reads merged on `main`, this slice keeps only three explicit follow-ups:

1. Runtime execution parity: local and shared runtime environments still need to serve the merged shortlist/award read surfaces consistently with issue #110.
2. Evidence parity: QA still needs executable proof that the manager review shell behaves correctly through the runtime stack, tracked in issue #111 and issue #11.
3. Award action readiness: `POST /v1/tasks/{taskId}/award` can stay contract-ready while the UI keeps the CTA secondary or disabled until the runtime environment confirms the write path is actually available.

## Acceptance criteria mapping

| Acceptance criterion | How this slice covers it |
| --- | --- |
| Candidate shortlist UI renders ranking breakdown, missing-field fallback, and loading/empty/error states. | The shortlist table, detail panel, and state table define ranking chips, explicit fallback copy, and dedicated loading/empty/error handling. |
| Award-readiness panel shows current task/bid status, blocking reasons, and dependency callouts without assuming unavailable backend fields. | The award-readiness rail maps task/proof state into blocker copy and keeps missing-contract notes visible instead of inventing unsupported data. |
| Any missing shortlist/award read contract is linked back to backend issue `#58` or a new follow-up instead of being hidden in the UI. | The document ties shortlist/award dependencies directly to issue #58 and PR #68 in the objective, mapping table, and dependency feedback section. |
| Scope excludes task-composer implementation details. | Task publish behavior remains explicitly out of scope; this slice begins only after a task already exists. |
