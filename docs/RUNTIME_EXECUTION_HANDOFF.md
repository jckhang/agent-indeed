# Runtime Execution Handoff

This document defines the planning-side handoff contract for the runtime-first sprint.
It keeps issue #109, issue #110, issue #111, and the blocked final E2E thread in issue
#11 aligned on one executable delivery path instead of four separate definitions of
"done."

## Scope

- issue #109: land a runnable control-plane skeleton with one documented local service
  command
- issue #110: wire the `publish -> match -> commit -> reveal -> verify -> award`
  vertical slice against persisted state
- issue #111: convert the existing smoke/E2E matrices into executable assertions
- issue #11: collect the final happy-path plus negative-path evidence needed for beta
  sign-off

This handoff does not replace implementation docs inside runtime PRs. It defines the
minimum evidence and command contract those PRs must publish before the sprint can claim
an executable path.

## Required command contract

Before issue #109, issue #110, or issue #111 can be closed, the owning PR set must
publish one reproducible local command path with the exact commands, required env vars,
and fixture/reset assumptions.

The command path must include:

1. `service command`
   - Starts the control-plane service on a clean local checkout.
   - Includes any required config/bootstrap step.
2. `reset or seed command`
   - Produces a deterministic local state for reruns.
   - May be a script, make target, or documented curl/sqlite bootstrap step.
3. `smoke command`
   - Executes the happy path plus the core negative-path assertions.
   - Exits non-zero on failure so QA and CI can consume it without manual log reading.

The exact command names are intentionally not frozen in this planning doc. Runtime owners
may choose the final script names, but they must surface one canonical command path in
their PR body and linked issue comments.

## Evidence package

Every PR or issue update claiming runtime progress must include enough evidence for a
different lane to rerun the flow without guessing.

Minimum evidence:

- literal output for the validation commands already required by repo policy
- the exact runtime command path used for the demonstration
- request/response evidence for each write step in the happy path:
  - publish
  - match
  - commit
  - reveal
  - verify
  - award
- identifiers that let QA or operators correlate the run:
  - `task_id`
  - `bid_id`
  - `proof_id`
  - `audit_id` or `decisionTraceHash`
- negative-path evidence for the first closure pass:
  - reveal without commit
  - invalid signature or upload/auth failure
  - proof verification fail
  - award blocked after failed proof or missing prerequisite

Issue #11 remains the aggregation point for final beta-readiness evidence. Runtime PRs
should link their evidence there rather than duplicating large transcripts across multiple
planning docs.

## Ownership handshake

| Lane | Required handoff output | Consumes from |
| --- | --- | --- |
| Planning (`owner:albatross`) | keeps this command/evidence contract current; checks that epic docs only claim executable progress when a real command path exists | issue #109, issue #110, issue #111 PR bodies and comments |
| Backend/runtime | publishes the service/reset/smoke commands and request/response fixtures | merged contracts, `docs/RUNTIME_CUTLINE_2026-03-16.md` |
| QA | converts the published command path into repeatable smoke/E2E execution and posts the signed evidence back to issue #11 | backend PR outputs, `docs/ERROR_CODE_RETRY_POLICY.md`, security readiness docs |

If a runtime PR can only show partial write-path progress, it should say exactly which
segment is runnable and which segment is still blocked by contract or implementation gaps.
Planning docs must not compress partial evidence into "E2E ready."

## Scenario matrix for the first executable tranche

| Scenario | Primary owner | Minimum proof before calling it done |
| --- | --- | --- |
| Happy path | issue #109 + issue #110 owners | One local run reaches `TASK_AWARDED` and emits the canonical audit events |
| Reveal without commit | issue #110 owner | Command/assertion shows the stable rejection and error code |
| Invalid signature or auth failure | issue #109 owner | Command/assertion shows write rejection before state mutation |
| Proof FAIL path | issue #110 + issue #111 owners | Verify step returns the published terminal failure vocabulary and award remains blocked |
| Audit evidence replay | issue #111 owner | Smoke run captures the event trail or trace identifiers needed for issue #11 evidence |

## Review rule

When planning or QA reviewers ask for "validation output" on runtime threads, the reply
must include both:

- repo policy validation (`openspec validate --all`, `git diff --check`, pre-push guard)
- runtime execution evidence from the canonical service/reset/smoke path

Passing spec validation alone is not enough for runtime implementation issues.
