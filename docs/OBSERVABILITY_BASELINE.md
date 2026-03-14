# MVP Observability Baseline

Last updated: 2026-03-14

## Goal

Define the minimum events, traces, logs, metrics, correlation identifiers, retention rules, and alert triggers needed to diagnose failures across the Phase 1 lifecycle:
`upload -> match -> bid -> verify -> award`.

This baseline is the observability contract for later implementation issues. Teams can change the transport or vendor later, but they should preserve the signals and identifiers defined here.

## Principles

- Prefer one shared correlation model across all modules over stage-local identifiers.
- Treat lifecycle events as append-only audit facts; corrections happen through new events.
- Keep logs structured and redact raw bundle memory, secret material, and full proof artifacts.
- Emit the smallest signal set that supports operator debugging, audit lookup, and future SLA reporting.
- Require every user-visible failure to carry an `auditId` that can be traced to logs and events.

## Correlation and identity contract

| Identifier | Source | Required on | Purpose |
| --- | --- | --- | --- |
| `trace_id` | Platform-generated per request/workflow hop | traces, logs, metrics exemplars, async handoff metadata | End-to-end distributed tracing |
| `span_id` | Tracing runtime | traces, structured logs | Intra-stage timing and dependency debugging |
| `audit_id` | Platform-generated per write decision | API responses, logs, events, alert payloads | Stable operator lookup for failures and decisions |
| `request_id` | Edge/API gateway | logs, traces, ingress metrics | Distinguish retries and transport-level failures |
| `idempotency_key` | client-supplied where supported | logs, traces, events | Replay and duplicate-write diagnosis |
| `agent_id` | domain object | events, logs, metrics dimensions | Agent upload and bidding ownership |
| `task_id` | domain object | events, logs, metrics dimensions | Task lifecycle correlation |
| `bid_id` | domain object | events, logs, metrics dimensions | Commit/reveal/proof correlation |
| `proof_id` | verifier output | events, logs, metrics dimensions | Verification result lookup |
| `decision_trace_hash` | award decision output | events, logs | Immutable award rationale reference |

## Signal taxonomy

### 1. Lifecycle events (append-only)

The platform must emit one immutable event for each accepted state transition and one explicit failure event for each terminal rejection that changes operator understanding.

| Stage | Required success events | Required failure events | Minimum event attributes |
| --- | --- | --- | --- |
| Upload | `AGENT_BUNDLE_RECEIVED`, `AGENT_BUNDLE_VALIDATED`, `AGENT_BUNDLE_INDEXED` | `AGENT_BUNDLE_REJECTED`, `AGENT_BUNDLE_VERSION_CONFLICT_DETECTED` | `event_id`, `event_type`, `occurred_at`, `trace_id`, `audit_id`, `agent_id`, `request_id`, `idempotency_key`, `payload_hash`, `result`, `error_code?` |
| Match | `TASK_CREATED`, `TASK_MATCH_REQUESTED`, `TASK_CANDIDATES_RANKED` | `TASK_CREATE_REJECTED`, `TASK_MATCH_FAILED` | `task_id`, `manager_id?`, `trace_id`, `audit_id`, `constraints_hash`, `candidate_count`, `result`, `error_code?` |
| Bid commit | `BID_COMMITTED` | `BID_COMMIT_REJECTED` | `task_id`, `bid_id`, `agent_id`, `trace_id`, `audit_id`, `commit_deadline_at`, `window_state`, `error_code?` |
| Bid reveal | `BID_REVEALED` | `BID_REVEAL_REJECTED` | `task_id`, `bid_id`, `agent_id`, `trace_id`, `audit_id`, `reveal_deadline_at`, `commit_reference`, `error_code?` |
| Verify | `POWM_POLICY_SELECTED`, `POWM_VERIFIED` | `POWM_VERIFICATION_FAILED`, `POWM_VERIFICATION_ESCALATED` | `task_id`, `bid_id`, `proof_id`, `trace_id`, `audit_id`, `identity_tier`, `policy_level`, `verification_status`, `error_code?` |
| Award | `TASK_AWARD_DECISION_RECORDED`, `TASK_AWARDED` | `TASK_AWARD_REJECTED`, `AUDIT_QUERY_MISSED` | `task_id`, `bid_id`, `trace_id`, `audit_id`, `decision_trace_hash`, `winner_agent_id`, `score_summary`, `proof_status`, `error_code?` |

Event rules:
- Every event includes `producer_module` and `schema_version`.
- Failure events must include the stable API/error code when one exists.
- Events must be queryable by `task_id` and `bid_id`; upload events must be queryable by `agent_id`.
- Events are append-only; corrections emit a new compensating event instead of mutating history.

### 2. Traces

Each stage must produce a trace span tree that answers three questions: what happened, where time was spent, and which dependency failed.

Required top-level spans:
- `agent.bundle.upload`
- `task.create`
- `task.match`
- `bid.commit`
- `bid.reveal`
- `proof.verify`
- `task.award`

Required span attributes:
- `trace_id`, `span_id`, `request_id`, `audit_id`
- Domain identifiers relevant to the stage (`agent_id`, `task_id`, `bid_id`, `proof_id`)
- `module`, `operation`, `result`, `error_code`, `retryable`
- Timing attributes for deadline-sensitive work (`commit_deadline_at`, `reveal_deadline_at`, `policy_eval_ms`, `verification_ms`)

Async handoff rule:
- When work crosses module or queue boundaries, the downstream consumer must continue the same `trace_id` and log the upstream event or message identifier.

### 3. Structured logs

Structured logs are required for request ingress, validation decisions, external dependency failures, and final state changes.

Minimum log fields:
- `timestamp`, `level`, `message`
- `trace_id`, `span_id`, `request_id`, `audit_id`
- `module`, `operation`, `result`, `error_code`, `retryable`
- Relevant domain IDs (`agent_id`, `task_id`, `bid_id`, `proof_id`)
- `actor_type` (`manager`, `agent`, `system`) and `actor_id` when available

Redaction rules:
- Do not log raw memory contents, private keys, full signatures, encrypted blobs, or full proof payloads.
- Log hashes, URIs, sizes, and validation summaries instead of raw sensitive artifacts.
- Record score and policy summaries, not full private model internals.

### 4. Metrics

Metrics should support SLO review, capacity planning, and fast incident triage.

Required counters:
- `agent_bundle_upload_requests_total`
- `agent_bundle_upload_failures_total`
- `task_create_requests_total`
- `task_match_failures_total`
- `bid_commit_requests_total`
- `bid_reveal_requests_total`
- `proof_verify_requests_total`
- `proof_verify_failures_total`
- `task_award_attempts_total`
- `task_award_failures_total`

Required histograms:
- `agent_bundle_validation_duration_ms`
- `task_match_duration_ms`
- `bid_commit_latency_ms`
- `bid_reveal_latency_ms`
- `proof_verify_duration_ms`
- `task_award_duration_ms`

Required gauges:
- `open_commit_windows`
- `open_reveal_windows`
- `proof_review_backlog`
- `audit_event_publish_lag_ms`

Required dimensions (bounded-cardinality only):
- `module`
- `result`
- `error_code`
- `identity_tier`
- `policy_level`
- `risk_level`

Do not dimension metrics by unbounded raw IDs such as full `task_id` or `bid_id`.

## Stage-by-stage diagnosis matrix

### Upload (`agent.bundle.upload`)

Must answer:
- Was the request malformed, unsigned, or in version conflict?
- Did indexing succeed after validation?
- Was a retry a deterministic replay or a split-brain write attempt?

Required focus signals:
- Events: `AGENT_BUNDLE_RECEIVED`, `AGENT_BUNDLE_VALIDATED`, `AGENT_BUNDLE_INDEXED`, rejection/conflict events
- Logs: schema path failures, signer mismatch, payload hash mismatch, index publish result
- Metrics: request count, validation duration, failure rate by error code

Alert-worthy failures:
- Signature failures spike above normal baseline.
- Indexing lag blocks accepted bundles from becoming matchable.
- Version conflicts increase unexpectedly for the same agent population.

### Match (`task.create` / `task.match`)

Must answer:
- Did task creation fail because constraints were incomplete or policy was invalid?
- Did matching return zero candidates because of filters or because retrieval failed?
- Was ranking computed and persisted for auditability?

Required focus signals:
- Events: `TASK_CREATED`, `TASK_MATCH_REQUESTED`, `TASK_CANDIDATES_RANKED`, failure events
- Logs: constraint validation summary, filter counts, ranking component summary
- Metrics: task create throughput, match latency, zero-candidate rate, match failure rate

Alert-worthy failures:
- Task create rejections rise after contract changes.
- Match latency exceeds SLA targets.
- Zero-candidate outcomes spike for otherwise common task profiles.

### Bid (`bid.commit` / `bid.reveal`)

Must answer:
- Did the bid fail because the window closed, the commit was missing, or the hash mismatched?
- Did retries create duplicates or preserve deterministic outcomes?
- Can operators reconstruct the commit/reveal sequence by `bid_id`?

Required focus signals:
- Events: `BID_COMMITTED`, `BID_REVEALED`, rejection events
- Logs: window state, commit reference lookup, replay/idempotency outcome
- Metrics: request totals, rejection rate by reason, commit-to-reveal conversion

Alert-worthy failures:
- Commit or reveal rejection rates spike for one task window.
- Duplicate commits increase after network instability.
- Reveal lookups fail because commit state is missing or delayed.

### Verify (`proof.verify`)

Must answer:
- Which policy level was selected, and why?
- Did the proof fail validation, require review, or pass with traceable evidence?
- Are manual-review backlogs blocking awards?

Required focus signals:
- Events: `POWM_POLICY_SELECTED`, `POWM_VERIFIED`, failure/escalation events
- Logs: policy inputs, verifier result summary, review escalation reason
- Metrics: verification duration, failure rate, `needs_review` backlog, policy mix by tier/risk

Alert-worthy failures:
- Verification failures spike for one identity tier or proof type.
- `needs_review` queue grows beyond operator capacity.
- Policy selection diverges from expected risk/tier combinations.

### Award (`task.award`)

Must answer:
- Was the award blocked by proof status, candidate eligibility, or missing audit data?
- Can the winning decision be reconstructed from score summary and proof summary?
- Did the award publish both the immutable event and the queryable decision trace?

Required focus signals:
- Events: `TASK_AWARD_DECISION_RECORDED`, `TASK_AWARDED`, rejection/miss events
- Logs: winner selection summary, decision trace hash, audit projection status
- Metrics: award latency, failure rate by precondition, audit publish lag

Alert-worthy failures:
- Award attempts fail because verification state is stale or missing.
- Decision traces are created without a corresponding immutable event.
- Audit query lag prevents operators from explaining an award in time.

## Retention and access expectations

| Signal | Minimum retention | Access expectation |
| --- | --- | --- |
| Lifecycle events / award traces | 180 days | Queryable by operators and reviewers for beta incident analysis |
| Structured logs | 30 days hot, 90 days cold/archive | Searchable by `audit_id`, `trace_id`, `task_id`, `bid_id` |
| Traces | 14 days | Searchable by `trace_id` and linked from logs/events |
| Metrics rollups | 90 days | Usable for trend review and release gates |
| High-severity alert history | 180 days | Supports post-incident review and tuning |

If infrastructure cost forces a shorter retention period, event retention is the last thing to shrink because it is the audit source of truth.

## Minimum implementation checklist for future issues

A future implementation issue should not be considered done unless it:
- Emits the required lifecycle event(s) for its stage.
- Propagates `trace_id`, `request_id`, and `audit_id` through logs and async handoffs.
- Publishes stage metrics with the required bounded dimensions.
- Documents any intentional gap from this baseline in the PR risk section.

