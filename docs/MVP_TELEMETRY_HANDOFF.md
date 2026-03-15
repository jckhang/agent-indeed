# MVP Telemetry Implementation Handoff

Last updated: 2026-03-15

## Objective

Translate [`docs/OBSERVABILITY_BASELINE.md`](docs/OBSERVABILITY_BASELINE.md) into a concrete delivery checklist so active M2-M4 work emits the minimum telemetry needed for closed-beta diagnosis and audit replay.

This handoff stays implementation-facing:
- it maps lifecycle stages to the current modules, endpoints, and async jobs
- it assigns telemetry expectations to active issues and open PRs
- it records contract gaps that still block reliable instrumentation
- it defines the smallest review/alert checklist required before M4 sign-off

## Stage-to-Module Delivery Map

| Lifecycle stage | Primary module(s) | Current API / job surfaces | Minimum telemetry that must land |
| --- | --- | --- | --- |
| Upload -> indexing | Onboarding Registry | `POST /v1/agents/bundles`, bundle indexing worker | `trace_id`, `request_id`, `agent_id`, bundle version, payload hash, indexing `job_id`, upload/validation result codes, backlog + latency metrics |
| Publish -> matching | Task Marketplace | `POST /v1/tasks`, candidate matching worker | `trace_id`, `request_id`, `task_id`, manager workspace scope, `job_id` for matching kickoff, candidate-count metrics, `TASK_MATCH_FAILED` reason codes |
| Bid commit -> reveal | Bid Ledger | `POST /v1/tasks/{taskId}/bids/commit`, `POST /v1/tasks/{taskId}/bids/reveal` | `trace_id`, `task_id`, `bid_id`, `agent_id`, window deadlines, rejection codes, commit-to-reveal completion metrics |
| Proof verification | PoMW Policy + Verifier | `POST /v1/tasks/{taskId}/proofs/verify`, verifier worker | `trace_id`, `task_id`, `bid_id`, `proof_id`, verifier `job_id`, policy version, required vs. achieved difficulty, retry/error metrics |
| Award -> audit/reputation | Audit Ledger + award orchestration | award decision flow, audit/event append, reputation writeback worker | `trace_id`, `task_id`, selected `bid_id`, `audit_id`, acting role, decision summary, writeback `job_id`, award failure counters |

## Active Work Item Telemetry Obligations

| Work item | Scope that must emit telemetry | Required additions before beta-ready | Why it matters |
| --- | --- | --- | --- |
| Issue #30 / backend onboarding kickoff | Upload validation + indexing | Emit upload stage events, persist `job_id` for indexing work, expose stable rejection reason codes, thread `trace_id` into async indexing | Without this, onboarding failures stop at the API boundary and cannot be joined to worker stalls |
| PR #55 / issue #6 candidate matching baseline | Publish + matching | Emit `TASK_MATCH_REQUESTED`, `TASK_CANDIDATES_SCORED`, `TASK_MATCH_FAILED`; record candidate counts, hard-filter failures, matching latency, and zero-candidate rate | Matching is the first async handoff after manager write traffic and the biggest M2 diagnosis gap |
| Issue #7 commit-reveal APIs | Bid ledger | Emit commit/reveal accept + reject events, preserve `bid_id` across both phases, and count expired-window failures | Commit/reveal fairness depends on proving ordering and rejection causes |
| PR #75 / issue #8 PoMW policy engine | Policy evaluation | Emit `POWM_POLICY_EVALUATED` with `identity.tier`, `task.risk_level`, policy version, and result code | Policy regressions must be explainable after rule changes |
| Issue #9 verifier result codes | Proof verification | Emit verifier request/result/failure events, record verifier `job_id`, retries, and `powm.result_code` distributions | Verification will be asynchronous and needs replayable failure evidence |
| Issue #10 audit events and award trace | Award + audit ledger | Emit `TASK_AWARD_*` events, include `audit_id`, `actor_type`, `decisionTraceHash`, and reputation writeback status | Beta reviewers cannot validate award correctness without a stitched audit trail |
| Issue #58 shortlist/award read-model contracts | Manager award reads | Preserve `audit_id`, proof result summary, and score-trace identifiers in read models surfaced to manager/operator UI | Read models must not drop the identifiers operators use to explain decisions |
| PR #74 / issue #47 audit visibility console baseline | Operator timeline UI | Render stage timestamps, `audit_id`, `trace_id`, and reason-code summaries from backend read models; flag missing critical events | UI is the proving ground that backend telemetry is actually consumable |
| PR #77 / issue #72 security readiness checklist | Security/compliance gating | Ensure auth context, redaction rules, and override reason capture remain mandatory in telemetry payloads | Security reviews fail if operational telemetry leaks sensitive fields or hides who acted |

## Current Contract Gaps Blocking Instrumentation

1. Matching kickoff lacks an explicit async correlation handle.
   - `POST /v1/tasks` returns task state only; it does not yet expose a matching `job_id`, `trace_id`, or retry surface.
   - Follow-on: update the task publication contract so candidate matching telemetry can be joined to the originating write path.

2. Proof verification still lacks a durable async status/read contract.
   - The verifier entrypoint exists, but no read-side contract yet guarantees how operators or UIs recover `proof_id`, verifier `job_id`, retry state, or terminal result after refresh.
   - Follow-on: keep issue #59 paired with verifier work so polling/event-stream semantics preserve telemetry identifiers instead of inventing UI-local state.

3. Award/audit read paths do not yet guarantee end-to-end replay identifiers.
   - The baseline requires `audit_id`, score summary, acting role, and proof-result trace, but current downstream award/read work is still pending.
   - Follow-on: keep issue #10 and issue #58 aligned so read models do not strip out backend audit fields.

4. Upload/indexing contracts still assume a mostly synchronous happy path.
   - The baseline already calls for indexing backlog and latency visibility, but the API draft does not yet expose whether indexing ran inline or via queue.
   - Follow-on: when onboarding implementation starts, add explicit indexing-job correlation or document that indexing is strictly inline for MVP.

## Minimal Beta Review Checklist

Before M4 readiness review, confirm:

- every lifecycle stage emits its required accepted + failed event names from the baseline
- `trace_id` survives API entrypoints, async workers, and audit/event appenders
- warning/error logs include business identifiers plus stable `reason_code`
- dashboards or reports exist for upload rejection spikes, zero-candidate rate, expired bid windows, verifier retries/timeouts, and award/audit timeline gaps
- operator/manual override flows capture acting role plus audit reason without leaking secrets, proof content, or raw memory payloads

## Immediate Next Sequence

1. Kestrel pairs issue #30, issue #6, issue #8, and issue #9 with concrete emitter fields before backend implementation drifts further.
2. Award/audit work keeps issue #10 and issue #58 locked to shared replay identifiers (`audit_id`, score trace, proof result summary).
3. Frontend/operator slices treat missing telemetry identifiers as blocking dependencies, not UI-only follow-ups.
