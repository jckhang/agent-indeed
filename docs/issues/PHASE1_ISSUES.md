# Phase 1 Issue Backlog

## GitHub Tracking (created)

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

## Epic

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
