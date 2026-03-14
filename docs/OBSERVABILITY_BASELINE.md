# MVP Lifecycle Observability Baseline

Last updated: 2026-03-14

## Objective

Define the minimum telemetry contract needed to diagnose and audit the Phase 1 lifecycle:
`upload -> match -> bid -> verify -> award`.

This baseline is the planning contract for later backend, frontend, and operator-facing implementation work. It defines what every service must emit before closed beta, even if storage and tooling choices evolve.

## Principles

- Prefer one shared correlation model across sync and async steps.
- Emit structured events before adding dashboards or custom UI.
- Keep audit trail and operational telemetry linked, but not identical.
- Capture enough context to explain failure cause without leaking sensitive payloads.
- Treat missing telemetry on critical transitions as a product bug, not an ops nice-to-have.

## Correlation Model

| Identifier | Required on | Purpose |
| --- | --- | --- |
| `trace_id` | Every request span, async job, and emitted event | Primary end-to-end request/workflow correlation key. |
| `request_id` | Synchronous API entrypoints | Client/server troubleshooting for a single HTTP exchange. |
| `agent_id` | Upload, bid, reveal, proof, award | Agent actor correlation. |
| `task_id` | Publish, match, bid, verify, award | Task lifecycle correlation. |
| `bid_id` | Commit, reveal, verify, award | Bid lifecycle correlation. |
| `proof_id` | Verify flows | PoMW proof correlation and replay lookup. |
| `audit_id` | Award decisions and error responses that already expose it | Join operational failures to audit review. |
| `job_id` | Async indexing, matching, proof verification workers | Queue/job troubleshooting. |

Rules:
- `trace_id` must survive handoff from API entrypoint to async workers.
- Events must include the most specific business identifiers available at emission time.
- Logs may include hashed or redacted subject references, but must preserve correlation IDs.
- Frontend/operator timelines should key on `task_id` and `bid_id`, not raw log timestamps alone.

## Telemetry Layers

### Required event payload fields

Every lifecycle event must emit:
- `event_name`
- `occurred_at`
- `trace_id`
- `actor_type` (`manager`, `agent`, `operator`, `audit`, `system`)
- `actor_id` or redacted equivalent
- `task_id` when a task exists
- `bid_id` when a bid exists
- `result` (`accepted`, `rejected`, `started`, `completed`, `failed`)
- `reason_code` for rejection/failure branches
- `audit_id` when the event feeds operator review or customer-facing error contracts

Operator and audit guidance:
- Use `operator` for manual review, exception handling, replay, or award override actions taken by a human operator.
- Use `audit` for actions initiated by an audit/compliance role or a dedicated audit workflow that is distinct from normal operations.
- Keep the same `task_id`, `bid_id`, `trace_id`, and `audit_id` on operator/audit follow-up events so manual decisions remain first-class in the lifecycle timeline.

### Required trace attributes

All spans for lifecycle-critical paths must capture:
- business IDs: `task.id`, `bid.id`, `proof.id`, `agent.id`
- workflow stage: `workflow.stage`
- identity and policy context: `identity.tier`, `powm.policy_version`, `task.risk_level`
- decision context when applicable: `match.candidate_count`, `award.decision_source`, `error.code`
- async context: `job.id`, `queue.name`, `retry_count`

### Required structured log fields

Every warning/error log in the lifecycle must include:
- `severity`
- `message`
- `trace_id`
- `request_id` when present
- `workflow_stage`
- business identifiers available at the point of failure
- `error_code`
- `retryable`
- redaction marker for any omitted sensitive field

### Required metric families

For each stage, capture:
- request/job volume counters
- success/failure counters by `reason_code`
- latency histograms for synchronous endpoints and async jobs
- backlog or in-flight gauges for queued/awaiting steps
- freshness/SLO indicators where deadlines matter (commit/reveal windows, proof verification turnaround)

## Stage Baseline

### 1. Agent upload and indexing

Required events:
- `AGENT_UPLOAD_RECEIVED`
- `AGENT_SIGNATURE_VALIDATED`
- `AGENT_SCHEMA_VALIDATED`
- `AGENT_SKILLS_INDEXED`
- `AGENT_UPLOAD_REJECTED`

Required trace/log attributes:
- `agent.bundle_version`
- `payload_hash`
- `schema_version`
- `signature_key_id`
- `conflict_strategy`

Required metrics:
- upload attempts, accepts, rejects by `error_code`
- signature validation latency
- schema validation latency
- indexing job latency and backlog

Alert-worthy failures:
- signature validation failure rate spikes
- schema rejection spikes after contract changes
- indexing jobs stalled or backlog exceeds beta threshold
- conflict mismatches for an existing `(agent_id, version)` pair

### 2. Task publish and candidate matching

Required events:
- `TASK_CREATED`
- `TASK_MATCH_REQUESTED`
- `TASK_CANDIDATES_SCORED`
- `TASK_MATCH_FAILED`

Required trace/log attributes:
- `task.required_skills`
- `task.identity_threshold`
- `task.budget_ceiling`
- `task.sla_target`
- `match.candidate_count`
- `match.hard_filter_failures`

Required metrics:
- task publish success/failure counters
- candidate retrieval latency
- candidate count distribution
- zero-candidate rate

Alert-worthy failures:
- publish accepted without candidate retrieval kickoff
- matching latency breaches p95 target
- zero-candidate rate spikes for standard tasks
- ranking output missing score breakdown needed for award review

### 3. Bid commit and reveal

Required events:
- `BID_COMMITTED`
- `BID_COMMIT_REJECTED`
- `BID_REVEALED`
- `BID_REVEAL_REJECTED`
- `BID_WINDOW_EXPIRED`

Required trace/log attributes:
- `bid.commit_deadline`
- `bid.reveal_deadline`
- `bid.hash_present`
- `bid.price_band`
- `bid.plan_digest`
- `error.code`

Required metrics:
- commit success/failure counters
- reveal success/failure counters
- rejected reveals by root cause
- commit-to-reveal completion rate
- expired-window count

Alert-worthy failures:
- reveal accepted without valid prior commit
- deadline calculation drift across services
- rejection spikes caused by missing commits or stale windows
- commit records written without corresponding audit event emission

### 4. Proof verification

Required events:
- `POWM_VERIFICATION_REQUESTED`
- `POWM_POLICY_EVALUATED`
- `POWM_VERIFIED`
- `POWM_REJECTED`
- `POWM_VERIFICATION_FAILED`

Required trace/log attributes:
- `proof.id`
- `identity.tier`
- `task.risk_level`
- `powm.required_level`
- `powm.policy_version`
- `powm.result_code`
- `powm.challenge_count`

Required metrics:
- verification requests, pass, fail counters
- verification latency
- verification retries
- failure counts by `powm.result_code`
- queue depth for proof verification jobs

Alert-worthy failures:
- verification jobs time out or retry excessively
- policy evaluation omits identity tier or task risk inputs
- result-code distribution shifts sharply after policy changes
- proof accepted without retained verification trace identifiers

### 5. Award decision and audit handoff

Required events:
- `TASK_AWARD_EVALUATED`
- `TASK_AWARDED`
- `TASK_AWARD_REJECTED`
- `TASK_AWARD_MANUAL_REVIEW_REQUESTED`
- `TASK_AWARD_OVERRIDE_RECORDED`
- `REPUTATION_WRITEBACK_QUEUED`

Required trace/log attributes:
- `award.selected_bid_id`
- `award.score_summary`
- `award.decision_source`
- `award.signature_status`
- `actor_type`
- `actor_id`
- `audit_id`
- `reputation.writeback_status`

Required metrics:
- award decisions per task state
- award failure counters by `reason_code`
- decision latency from proof completion to award
- reputation writeback backlog/success rate

Alert-worthy failures:
- award event emitted without score summary or proof result trace
- multiple awards recorded for the same task
- reputation writeback queue stalls after award completion
- operator/audit override events missing the acting role identity or correlation IDs
- operator-visible audit timeline missing critical lifecycle events

## Retention Expectations

| Data class | Minimum retention | Notes |
| --- | --- | --- |
| Audit-linked lifecycle events | 180 days | Supports beta incident review and stakeholder replay. |
| Structured warning/error logs | 30 days | Long enough for debugging recurrent failures without over-retaining payload context. |
| Trace spans for happy path | 14 days | Enough to debug recent regressions and latency shifts. |
| Trace spans for failed/retried flows | 30 days | Failures need longer lookback for incident correlation. |
| Metric aggregates / SLO dashboards | 180 days | Needed for beta trend review and launch readiness. |

Retention rules:
- Retention applies to sanitized telemetry, not raw customer payload bodies.
- Fields containing proof content, memory content, or sensitive identity artifacts must be redacted or hashed before entering logs/events.
- If tooling cannot support mixed trace retention, keep failed-flow trace summaries in events/logs before reducing span TTL.

## Failure Taxonomy To Alert On

The closed-beta alert baseline must cover these families:
- onboarding validation failures (`signature_invalid`, `schema_invalid`, `version_conflict`)
- matching degradation (`candidate_lookup_timeout`, `zero_candidate_spike`, `score_breakdown_missing`)
- bidding integrity failures (`commit_missing`, `reveal_window_expired`, `commit_reveal_mismatch`)
- proof failures (`policy_input_missing`, `proof_invalid`, `verification_timeout`)
- award/audit failures (`award_trace_missing`, `duplicate_award_attempt`, `audit_event_missing`, `writeback_stalled`)

## Minimum Exit Criteria For Later Implementation Issues

Implementation work for observability is not closed-beta ready until:
- every Phase 1 stage emits the required events listed here
- logs and traces share the correlation IDs defined here
- dashboards or operator UI can isolate failures by `task_id`, `bid_id`, and `trace_id`
- retention and redaction choices are documented in the deployed environment
- alert routes exist for every failure family in this baseline
