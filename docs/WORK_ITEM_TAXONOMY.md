# Work Item Taxonomy (Issue + PR)

Last updated: 2026-03-20

## Purpose

Define one shared enum-based taxonomy for GitHub issues and pull requests so planning, implementation, QA, and reporting use the same labels.

## Department enum (required)

Exactly one department label is required on every issue and PR:

- `dept/frontend`
- `dept/backend`
- `dept/qa`
- `dept/planning`

## Type enum (required)

Exactly one type label is required on every issue and PR:

- `type/feature` (new behavior or endpoint)
- `type/bugfix` (behavior correction)
- `type/refactor` (internal structure improvement without behavior change)
- `type/docs` (documentation-only changes)
- `type/test` (test coverage or test tooling)
- `type/chore` (maintenance, automation, dependency/process updates)
- `type/spec` (OpenSpec or contract-definition change)

## Rules

- Every issue must include exactly one `dept/*` label and one `type/*` label.
- Every PR must include exactly one `dept/*` label and one `type/*` label.
- Every open Phase 1 issue/PR should also carry one owner label, one priority label, and one status label.
- Work-in-flight threads should carry the stream labels that explain which lane is active.
- M1 and issue #11 follow-through threads should carry at least one `work/*` label so reviewers can filter the queue by surviving work package.
- Open planning and QA PRs should carry the milestone that matches the live gate they unblock.
- PR body must map changes to acceptance criteria and provide a QA plan.
- PRs without valid labels should be considered non-ready for review.

## Owner enum

Use exactly one owner label on active issues/PRs:

- `owner:albatross`
- `owner:avery`
- `owner:kestrel`
- `owner:lanzhou-fe-agent`

## Priority enum

Use exactly one priority label on active issues/PRs:

- `priority/P0`
- `priority/P1`

## Status enum

Use exactly one current-state label on active issues/PRs:

- `status/ready-next`
- `status/in-review`
- `status/blocked`

## Stream enum

Apply one or more stream labels to describe the active lane:

- `stream/agent-onboarding`
- `stream/backend-core`
- `stream/beta-readiness`
- `stream/contract-convergence`
- `stream/frontend-surface`
- `stream/planning-sync`
- `stream/qa-handoff`
- `stream/review-burndown`
- `stream/runtime-consumers`
- `stream/runtime-execution`
- `stream/runtime-handoff`

## Work package enum

Use the smallest stable `work/*` label set that still explains why a thread survives in the queue:

- `work/onboarding-upload`: executable onboarding upload route plus its frontend/QA follow-through.
- `work/evidence-handoff`: issue #11 evidence packets, runnable smoke proof, and related planning/QA references.
- `work/contract-vocabulary`: verify/award vocabulary convergence against merged OpenSpec/OpenAPI/contracts.
- `work/epic-gates`: epic/checkpoint/beta-readiness gate hygiene and merge-train planning work.

## Milestone rule

- Use the milestone that matches the gate the thread is actively unblocking, not the original umbrella epic.
- Current examples: onboarding upload work belongs on `M1 Contract Freeze + Upload`; issue #11 evidence publication belongs on `M4 Audit + Beta Readiness`; verify/award vocabulary cleanup belongs on `M3 Verify + Agent Flow`.
- Validate open planning/QA issue + PR hygiene with `PATH="/opt/homebrew/opt/node/bin:$PATH" npm run check:work-item-metadata`; the command fails under `-- --assert` if any tracked work item still misses owner/priority/status/stream/work labels or a milestone.

## Recommended mapping examples

- API contract update: `dept/backend` + `type/spec`
- Frontend page implementation: `dept/frontend` + `type/feature`
- Test matrix expansion: `dept/qa` + `type/test`
- Roadmap and planning updates: `dept/planning` + `type/docs`
