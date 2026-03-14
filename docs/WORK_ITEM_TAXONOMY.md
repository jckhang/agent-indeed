# Work Item Taxonomy (Issue + PR)

Last updated: 2026-03-14

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
- PR body must map changes to acceptance criteria and provide a QA plan.
- PRs without valid labels should be considered non-ready for review.

## Recommended mapping examples

- API contract update: `dept/backend` + `type/spec`
- Frontend page implementation: `dept/frontend` + `type/feature`
- Test matrix expansion: `dept/qa` + `type/test`
- Roadmap and planning updates: `dept/planning` + `type/docs`
