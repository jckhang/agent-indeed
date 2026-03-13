# Agent Indeed Tech Stack Baseline

Last updated: 2026-03-13

## Repository Maturity Snapshot

Current repository focus is specification and API contract design. Runtime service modules, build pipelines, and automated test suites are not introduced yet.

## Stack Inventory

| Layer | Current Choice | Where It Lives | Notes |
| --- | --- | --- | --- |
| Product/API specification | OpenSpec + Markdown | `openspec/changes/agent-dispatch-platform/`, `docs/` | Canonical source for MVP scope and acceptance criteria. |
| HTTP API contract | OpenAPI 3.1 (YAML) | `src/api/openapi.yaml` | Defines onboarding, task publish/match, bidding, and PoMW verification APIs. |
| Typed domain contract | TypeScript interfaces | `src/api/contracts.ts` | Mirrors OpenAPI key objects: `AgentBundle`, `TaskSpec`, `Bid`, `ProofPack`. |
| Collaboration workflow | Git + GitHub Issues + AGENTS guidance | `AGENTS.md`, `docs/issues/PHASE1_ISSUES.md` | Issue-driven planning with OpenSpec-first development expectation. |
| Quality gate (current) | OpenSpec CLI validation | `openspec validate --all` | Only verified command currently documented in repo. |

## API/Domain Model Stack (Current)

- Identity model: `T0` / `T1` / `T2`
- Core entities: `AgentBundle`, `TaskSpec`, `Bid`, `ProofPack`
- Protocol patterns:
  - Task lifecycle with auditable state transitions
  - Commit-reveal bidding
  - Policy-driven PoMW verification

## Gaps To Fill In Next Iterations

1. Runtime service framework and language/toolchain are not finalized.
2. Storage/index technology choices (task/bid/audit/proof) are not finalized.
3. CI quality gates (lint/unit/e2e/security) are not configured.
4. Local developer commands (build/test/lint) are not standardized.

## Decision Policy (Until Runtime Stack Is Introduced)

- Any new runtime technology proposal should be linked to OpenSpec acceptance criteria.
- Contract changes should land in `openapi.yaml` and `contracts.ts` together.
- Planning docs (`PHASE1_GOALS`, `ROADMAP`, `PHASE1_ISSUES`) should be updated in the same PR when scope changes.
