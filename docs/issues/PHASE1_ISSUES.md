# MVP Issue Backlog (P0 + P1)

## GitHub Tracking (created)

- P0-00 #14 (closed): https://github.com/jckhang/agent-indeed/issues/14
- P0-01 #15: https://github.com/jckhang/agent-indeed/issues/15
- P0-02 #16: https://github.com/jckhang/agent-indeed/issues/16
- P0-03 #21: https://github.com/jckhang/agent-indeed/issues/21
- P0-04 #22: https://github.com/jckhang/agent-indeed/issues/22
- P0-05 #23: https://github.com/jckhang/agent-indeed/issues/23
- P0-06 #32: https://github.com/jckhang/agent-indeed/issues/32
- P0-07 #33: https://github.com/jckhang/agent-indeed/issues/33
- P0-08 #34: https://github.com/jckhang/agent-indeed/issues/34
- P0-09 #57: https://github.com/jckhang/agent-indeed/issues/57
- Epic #2: https://github.com/jckhang/agent-indeed/issues/2
- P1-01 #3: https://github.com/jckhang/agent-indeed/issues/3
- P1-02 #4: https://github.com/jckhang/agent-indeed/issues/4
- P1-03 #5: https://github.com/jckhang/agent-indeed/issues/5
- P1-04 #6: https://github.com/jckhang/agent-indeed/issues/6
- P1-05 #7: https://github.com/jckhang/agent-indeed/issues/7
- P1-06 #8: https://github.com/jckhang/agent-indeed/issues/8
- P1-07 #9: https://github.com/jckhang/agent-indeed/issues/9
- P1-08 #10: https://github.com/jckhang/agent-indeed/issues/10
- P1-09 #11: https://github.com/jckhang/agent-indeed/issues/11
- P1-14 #43: https://github.com/jckhang/agent-indeed/issues/43
- P1-11 #37: https://github.com/jckhang/agent-indeed/issues/37
- P1-15 #44: https://github.com/jckhang/agent-indeed/issues/44
- P1-12 #38: https://github.com/jckhang/agent-indeed/issues/38
- P1-13 #39: https://github.com/jckhang/agent-indeed/issues/39
- P1-19 #61 (closed): https://github.com/jckhang/agent-indeed/issues/61
- P1-21 #63: https://github.com/jckhang/agent-indeed/issues/63
- P1-23 #65: https://github.com/jckhang/agent-indeed/issues/65

## P0 Readiness

### P0-00 Repository baseline unblockers

Description:
- Fix high-priority process/documentation gaps that can cause invalid changes to slip through review.
- Establish a repeatable contribution workflow and stack baseline before scaling feature implementation.

Acceptance criteria:
- Repository guidance commands are executable and verified.
- Contribution process documentation exists and is linked from issue tracking.
- Tech stack baseline and current gaps are documented and linked from issue tracking.

## P0 Delivery Issues

### P0-01 Publish contribution workflow baseline (`CONTRIBUTING.md`)

References:
- `CONTRIBUTING.md`
- `AGENTS.md`
- `docs/ROADMAP.md`

Acceptance criteria:
- Branching, OpenSpec-first flow, validation command, and PR checklist are documented.
- Guidelines explicitly require contract sync for `openapi.yaml` and `contracts.ts`.
- Document is linked by a tracked GitHub issue.

### P0-02 Publish repository tech stack baseline (`docs/TECH_STACK.md`)

References:
- `docs/TECH_STACK.md`
- `src/api/openapi.yaml`
- `src/api/contracts.ts`

Acceptance criteria:
- Current stack choices are enumerated by layer and mapped to repository paths.
- Unresolved technology decisions and quality-gate gaps are explicitly listed.
- Document is linked by a tracked GitHub issue.

### P0-03 Publish architecture gap assessment (`docs/ARCHITECTURE_GAPS.md`)

References:
- `docs/ARCHITECTURE_GAPS.md`
- `docs/TECH_STACK.md`
- `docs/ROADMAP.md`

Acceptance criteria:
- Current delivery blockers are categorized by priority with concrete impact.
- Frontend and backend gaps are explicitly separated.
- Gap outputs map to next actionable issue scopes.

### P0-04 Publish FE/BE execution tracks (`docs/ENGINEERING_TRACKS_FE_BE.md`)

References:
- `docs/ENGINEERING_TRACKS_FE_BE.md`
- `docs/PHASE1_GOALS.md`
- `src/api/openapi.yaml`

Acceptance criteria:
- Backend and frontend tracks each define milestones and exit criteria.
- Integration checkpoints are explicit for weekly execution.
- Scope remains MVP-focused and excludes non-critical expansion.

### P0-05 Publish staffing and recruiting plan (`docs/HR_HIRING_PLAN.md`)

References:
- `docs/HR_HIRING_PLAN.md`
- `docs/ROADMAP.md`

Acceptance criteria:
- Role gaps, priority, and target hiring window are defined.
- Each core role includes mission, must-have skills, and 30/60/90 expectations.
- Interview loop and evaluation rubric are documented for HR execution.

### P0-06 Define backend service boundaries and ownership map

References:
- `docs/BACKEND_SERVICE_BOUNDARIES.md`
- `docs/ARCHITECTURE_GAPS.md`
- `docs/ENGINEERING_TRACKS_FE_BE.md`
- `src/api/openapi.yaml`

Acceptance criteria:
- Service/module map is documented with clear responsibilities.
- Each MVP flow stage has an owning backend module.
- Cross-module contract dependencies and sequencing risks are called out.

### P0-07 Define frontend MVP surface and API wiring matrix (`docs/FRONTEND_MVP_SURFACE.md`)

References:
- `docs/FRONTEND_MVP_SURFACE.md`
- `docs/ARCHITECTURE_GAPS.md`
- `docs/ENGINEERING_TRACKS_FE_BE.md`
- `src/api/openapi.yaml`

Acceptance criteria:
- Persona map covers manager, agent, and operator roles.
- MVP page map is limited to the closed-beta flow.
- API-to-UI field matrix exists for each required page.
- Integration risks or missing backend fields are listed explicitly.
- Output is linked by issue #33.

### P0-08 Freeze MVP state model and write sequencing (`docs/MVP_STATE_MODEL.md`)

References:
- `docs/MVP_STATE_MODEL.md`
- `src/api/openapi.yaml`
- `openspec/changes/agent-dispatch-platform/specs/task-marketplace-bidding-powm/spec.md`

Acceptance criteria:
- Task, bid, proof, and audit state transitions are documented.
- Invalid or out-of-order transitions are explicitly rejected.
- Write sequencing and idempotency expectations are defined for commit/reveal/verify/award.
- Output provides direct implementation direction for follow-on P1 issues.

### P0-09 Operationalize roadmap checkpoints as milestone/status board (`docs/PHASE1_CHECKPOINT_BOARD.md`)

Acceptance criteria:
- Every active P1 issue is mapped to a checkpoint owner/date.
- Duplicate or prematurely closed issue states are called out and normalized.
- The repo has one obvious place to review checkpoint drift at a glance.

## P1 Epic

### P1-00 MVP: Agent Dispatch Foundation

Description:
- Deliver end-to-end closed beta flow based on OpenSpec `agent-dispatch-platform`.
- Cover onboarding, task publish/match, commit-reveal bidding, PoMW verify, and auditable award.

Acceptance criteria:
- All Phase 1 goals in `docs/PHASE1_GOALS.md` met.
- E2E flow demonstrated with API-level tests.

## Delivery Issues

### P1-01 Define AgentBundle contract and validation rules

References:
- `openspec/changes/agent-dispatch-platform/specs/agent-onboarding-sync/spec.md`
- `src/api/openapi.yaml`
- `src/api/contracts.ts`

Acceptance criteria:
- Contract fields and validation errors are unambiguous.
- Signature and version conflict rules are documented.

### P1-02 Implement onboarding pipeline (signature/schema/index)

Acceptance criteria:
- Valid signed bundle returns `agent_id` and `version`.
- Invalid signature is rejected with audit-friendly error code.
- Skills metadata is indexed for matching.

### P1-03 Define TaskSpec and publish endpoint behavior

References:
- `openspec/changes/agent-dispatch-platform/specs/task-marketplace-bidding-powm/spec.md`

Acceptance criteria:
- Required constraints enforced at task creation.
- Task status enters marketplace when constraints are complete.

### P1-04 Implement candidate matching baseline (hard + soft)

Acceptance criteria:
- Hard-filter gate enforced before ranking.
- Ranking output includes score breakdown for auditability.

### P1-05 Implement commit-reveal bidding APIs

Acceptance criteria:
- Commit accepted only during commit window.
- Reveal requires prior valid commit.
- Reveal payload includes bid details and `ProofPack`.

### P1-06 Implement PoMW policy engine (T0/T1/T2)

Acceptance criteria:
- Policy input: task risk/value + identity tier + trust score.
- Policy output: required proof strength and verifier parameters.
- Policy decision is persisted with trace id.

Implementation notes:
- Add a dedicated PoMW policy resolve contract before proof verification.
- Carry `policyTraceId` from policy decision into proof verification and downstream audit.

### P1-07 Implement ProofPack verifier + result codes

Acceptance criteria:
- Verification status is explicit (`passed`, `failed`, `needs_review`).
- Failure reason codes are stable and documented.

### P1-08 Implement audit events + award decision trace

Acceptance criteria:
- Required lifecycle events emitted.
- `TASK_AWARDED` stores candidate score and proof summary.
- Event stream is queryable by task id and bid id.

### P1-09 Add E2E test suite and API examples for MVP flow

Acceptance criteria:
- Happy path and core abuse path tests pass in CI.
- API examples cover upload, publish, commit, reveal, verify, award.

### P1-11 Publish error-code catalog and retry/idempotency policy

References:
- `docs/ERROR_CODE_RETRY_POLICY.md`
- `src/api/openapi.yaml`
- `src/api/contracts.ts`
- `openspec/changes/agent-dispatch-platform/specs/agent-onboarding-sync/spec.md`
- `openspec/changes/agent-dispatch-platform/specs/task-marketplace-bidding-powm/spec.md`

Acceptance criteria:
- Stable error codes are listed per MVP flow stage with trigger conditions and client handling guidance.
- Retryability and idempotency rules are explicit for upload, publish, commit, reveal, verify, and award operations.
- The catalog is reflected consistently across OpenSpec scenarios and API drafts.

### P1-12 Define observability baseline for MVP lifecycle

References:
- `docs/OBSERVABILITY_BASELINE.md`
- `docs/ARCHITECTURE_GAPS.md`
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- `openspec/changes/agent-dispatch-platform/design.md`
- `openspec/changes/agent-dispatch-platform/specs/task-marketplace-bidding-powm/spec.md`

Acceptance criteria:
- Required events, trace attributes, logs, and metrics are defined for each MVP flow stage.
- Correlation identifiers and retention expectations are documented for debugging and audit use.
- Alert-worthy failure modes are called out for onboarding, bidding, verification, and award flows.
- The baseline is linked from Phase 1 planning artifacts and OpenSpec scope so downstream implementation can stay aligned.

### P1-13 Define security and compliance baseline for closed beta

References:
- `docs/SECURITY_COMPLIANCE_BASELINE.md`
- `docs/ARCHITECTURE_GAPS.md`
- `docs/ROADMAP.md`
- `docs/PHASE1_GOALS.md`
- `src/api/openapi.yaml`

Acceptance criteria:
- AuthN/AuthZ model is documented for manager, agent, and internal verifier/audit roles.
- Sensitive fields and handling requirements are listed for onboarding, bidding, proof, and audit data.
- Closed-beta guardrails and minimum compliance checklist are explicit and testable.
- The baseline identifies follow-on implementation issues needed before beta readiness.

### P1-24 Track MVP telemetry implementation handoff

References:
- `docs/OBSERVABILITY_BASELINE.md`
- `docs/MVP_TELEMETRY_HANDOFF.md`
- `docs/PHASE1_GOALS.md`
- `docs/ROADMAP.md`
- `docs/PHASE1_CHECKPOINT_BOARD.md`
- `openspec/changes/agent-dispatch-platform/design.md`
- `openspec/changes/agent-dispatch-platform/specs/task-marketplace-bidding-powm/spec.md`

Acceptance criteria:
- Required events, trace fields, logs, and metrics are mapped from the baseline to the current MVP modules, endpoints, and async jobs.
- Active issues and open PRs are assigned the telemetry they must land before beta readiness.
- Missing business identifiers or async-read contracts that block instrumentation are called out explicitly.
- A minimal alert/review checklist exists for M4 telemetry readiness.

### P1-15 Build agent bidding console baseline

References:
- `docs/AGENT_BIDDING_CONSOLE_BASELINE.md`

Acceptance criteria:
- Agent can complete commit and reveal flows from UI with deadline/status feedback.
- ProofPack entry or upload inputs reflect current API contract and validation hints.
- Verification outcome and failure reasons are rendered in a timeline/status view.
- Missing async-update requirements (polling/event stream) are explicitly documented if they block UX completion.

Backlog notes:
- Bid status refresh still needs a task-scoped bid read model before the UI can survive browser refreshes or cross-device resume.
- Proof verification status still needs a proof read endpoint and polling/event guidance before the timeline can promise live updates.

### P1-21 Implement agent bid commit/reveal workspace UI

References:
- `docs/AGENT_BID_COMMIT_REVEAL_WORKSPACE.md`
- `docs/AGENT_BIDDING_CONSOLE_BASELINE.md`
- `docs/FRONTEND_MVP_SURFACE.md`
- `docs/ERROR_CODE_RETRY_POLICY.md`
- `src/api/openapi.yaml`
- `src/api/contracts.ts`

Acceptance criteria:
- Agent can prepare commit and reveal payloads from one task-scoped workflow with clear server-authored deadline and phase feedback.
- Required `ProofPack` sections are explicit in the UI slice, and missing required sections are highlighted before submit.
- UX states cover commit-window closed, reveal-without-commit, reveal hash mismatch, and proof payload validation failures.
- Any missing refresh-safe bid/proof read contract remains a documented backend dependency rather than an implicit frontend assumption.

Backlog notes:
- Issue #59 remains the follow-up for task-scoped bid/proof reads and async refresh behavior.
- Any `ProofPack` contract change must update this slice, `src/api/openapi.yaml`, and `src/api/contracts.ts` together.

### P1-14 Build manager console baseline for task publish and award

References:
- `docs/MANAGER_CONSOLE_BASELINE.md`
- `docs/ENGINEERING_TRACKS_FE_BE.md`
- `docs/MVP_STATE_MODEL.md`
- `docs/ERROR_CODE_RETRY_POLICY.md`
- `src/api/openapi.yaml`
- `src/api/contracts.ts`

Acceptance criteria:
- Manager can create an MVP task from UI using the current `TaskSpec` contract.
- Candidate/ranking output is rendered with score breakdown and missing-field handling.
- Award decision summary is visible with clear state/status messaging and backend dependency callouts.
- Any API contract gaps found during UI planning are fed back into the backlog with explicit notes.

Backlog notes:
- Manager candidate review still needs a task-scoped ranking read model from matching work before the UI can move beyond placeholders.
- Award summary and award command contracts are still pending and must align with audit/award trace work before an interactive CTA can ship.

### P1-16 Build audit visibility console baseline

References:
- `docs/AUDIT_VISIBILITY_CONSOLE_BASELINE.md`
- `docs/FRONTEND_MVP_SURFACE.md`
- `docs/MVP_STATE_MODEL.md`
- `docs/OBSERVABILITY_BASELINE.md`
- `docs/ERROR_CODE_RETRY_POLICY.md`

Acceptance criteria:
- Task and bid audit timelines are rendered in a readable sequence with clear event names and timestamps.
- Proof, commit, reveal, and award failure reasons are translated into operator-friendly UI states.
- UI explicitly highlights missing audit/event fields that block stakeholder review.
- The slice stays queue-ready until backend audit/query contracts are stable enough to integrate.

Backlog notes:
- Task-scoped audit event reads still need a normalized event stream contract before the UI can move beyond documented placeholders.
- Award trace and shortlist-read dependencies must stay aligned with issue `#10` and issue `#58` so audit review does not infer missing backend evidence.

### P1-23 Implement operator audit timeline and failure-state UI

References:
- `docs/OPERATOR_AUDIT_TIMELINE_BASELINE.md`
- `docs/FRONTEND_MVP_SURFACE.md`
- `docs/ERROR_CODE_RETRY_POLICY.md`
- `docs/MVP_STATE_MODEL.md`
- `src/api/openapi.yaml`
- `src/api/contracts.ts`

Acceptance criteria:
- Operator timeline renders task and bid audit events in chronological order with clear event names and timestamps.
- Proof, commit, reveal, and award failures are translated into operator-friendly states instead of raw backend codes only.
- Missing audit/event fields that block stakeholder review are highlighted explicitly in the UI.
- Scope stays focused on operator audit visibility and does not expand into general admin-console work.

Backlog notes:
- The operator timeline still needs a task-scoped event read contract before it can render real lifecycle history.
- Verification and award events still need explicit completeness guarantees so the UI can distinguish missing audit data from business-state failures.

### P1-19 Implement manager task composer UI slice

References:
- `docs/MANAGER_TASK_COMPOSER_UI_SLICE.md`
- `docs/FRONTEND_MVP_SURFACE.md`
- `src/api/openapi.yaml`
- `src/api/contracts.ts`

Acceptance criteria:
- Manager task composer covers the current `TaskSpec` fields needed for MVP task creation.
- Validation hints and blocking states are rendered for missing or invalid required fields.
- Submission flow documents any backend contract mismatch found during implementation instead of silently inventing fields.
- Scope stays focused on task creation and does not absorb shortlist or award UI work.
