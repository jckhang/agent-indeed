# MVP Issue Backlog (P0 + P1)

## GitHub Tracking (created)

- P0-00 #14 (closed): https://github.com/jckhang/agent-indeed/issues/14
- P0-01 #15: https://github.com/jckhang/agent-indeed/issues/15
- P0-02 #16: https://github.com/jckhang/agent-indeed/issues/16
- P0-03 #21: https://github.com/jckhang/agent-indeed/issues/21
- P0-04 #22: https://github.com/jckhang/agent-indeed/issues/22
- P0-05 #23: https://github.com/jckhang/agent-indeed/issues/23
- P0-06 #32: https://github.com/jckhang/agent-indeed/issues/32
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
