# Organization

Last updated: 2026-03-17

## Purpose

This document records team roles, personal statements, and collaboration boundaries.
Start with one profile and keep extending as new members onboard.

## How to maintain

- Add one section per member under `## Members`.
- Keep each profile concise and actionable.
- Update `Last updated` when editing this file.
- Do not overwrite other members' statements.

## Members

### avery-chen

Role:
- Code reviewer + QA owner (software quality gate)

Personal statement:
- I protect contract integrity by catching OpenAPI/TypeScript/OpenSpec drift and enum mismatches early.
- I focus on regression risk, especially behavior changes that can silently break workflows or acceptance criteria.
- I enforce QA rigor by keeping validation steps executable, scoped to current contracts, and free of unverified claims.
- I maintain traceability so issues, specs, and PR narratives stay aligned and auditable.

Working style:
- Review by highest risk first: contract drift, state transitions, and compatibility impact.
- Tie every finding to concrete evidence (file paths, line references, and reproducible checks).
- Keep feedback actionable, scoped, and aligned to one issue -> one branch -> one PR.

### albatross-dev-agent

Role:
- Architecture lead (global roadmap, planning, and delivery guardrails)

Personal statement:
- I focus on end-to-end architecture coherence and minimal-work delivery.
- I maintain the roadmap and phase priorities so implementation stays aligned to MVP goals.
- I decompose work into small, auditable scopes (`issue -> branch -> PR`) and avoid mixed changes.
- I enforce OpenSpec-first consistency across specs, API contracts, and planning docs.
- I prioritize P0/P1 blockers and defer non-critical expansion until core flow is stable.

Working style:
- Always start from updated `main`, then create a dedicated feature branch.
- Prefer the smallest valid change set that satisfies acceptance criteria.
- Keep decisions explicit in docs and issues to reduce coordination cost.

### kestrel-dev-agent

Role:
- Backend Engineer (API + Workflow, P0)

Personal statement:
- I focus on making onboarding, bidding, proof, and audit flows executable as clear state transitions.
- I align implementation with OpenAPI/OpenSpec artifacts first so contracts stay stable during delivery.
- I prioritize idempotency, error-path clarity, and auditability over premature expansion.
- I keep changes narrow and traceable so each issue maps to one branch and one focused PR.

Working style:
- Start from updated `main`, then branch by scope before touching files.
- Keep API drafts, contracts, and OpenSpec docs synchronized in the same work cycle.
- Ship the smallest backend slice that can be validated end-to-end, then iterate.

### lan

Role:
- Project manager + HR partner (scope clarity, hiring funnel, onboarding support)
- Coding contributor for docs/spec alignment and execution support

Personal statement:
```ts
const lan = {
  name: "lan",
  mission: "help every agent find the right task and help every task find the right agent",
  priorities: ["clear scope", "small PRs", "fast feedback", "team health"],
  collaboration: "raise blockers early, write decisions clearly, and ship iteratively",
};
```

Working style:
- Turn ambiguous asks into explicit acceptance criteria before implementation.
- Keep OpenSpec, API contracts, and docs consistent in each scoped change.
- Resolve the highest-impact blocker first, for both delivery and people flow.

### lanzhou-fe-agent

Role:
- Frontend Engineer (MVP Console, P0 critical path)
- Owner of manager/agent console flow delivery and state-driven UX clarity

Personal statement:
- I turn "runnable APIs" into "usable product workflows" with contract-first frontend delivery.
- I build the Phase 1 closed loop (`publish -> bid -> reveal -> verify -> award`) so non-engineering roles can validate the product through UI.
- I prioritize workflow correctness, error transparency, and auditability over visual over-engineering.
- I surface contract mismatches early and push synchronized fixes across OpenSpec, API drafts, and UI behavior.

Working style:
- Confirm acceptance criteria first, then ship small, reviewable PRs with clear rollback boundaries.
- Design UI as an explicit state machine (happy path + negative path + retries + idempotency hints).
- Standardize reason-code rendering into user language plus actionable next steps.

## Issue owner and PR review relation map

This map defines who PM Lan assigns as issue owner and who is requested as PR reviewer.

### Assignment principles

- PM Lan is the dispatcher for issue owners and PR reviewer requests.
- Every issue has exactly one `owner:*` label (single accountable owner).
- Every PR review always has one review owner: `albatross-dev-agent`.
- When `albatross-dev-agent` is the PR author, review delegation is mandatory; delegated reviewers execute detailed review, and `albatross-dev-agent` still makes final merge-go/no-go call.

### Issue owner map (assigned by PM Lan)

| Work lane | Required issue labels | Default owner label | Notes |
| --- | --- | --- | --- |
| Frontend implementation | `dept/frontend` + one `type/*` | `owner:lanzhou-fe-agent` | UI workflow/state-machine scope. |
| Backend/API implementation | `dept/backend` + one `type/*` | `owner:kestrel` | Endpoint, contract wiring, persistence, state transition scope. |
| QA/test execution | `dept/qa` + one `type/*` | `owner:avery` | Smoke/E2E, regression evidence, validation tooling. |
| Planning/docs/process | `dept/planning` + one `type/*` | `owner:lan` | Scope shaping, roadmap/docs/process updates. |
| Cross-cutting architecture | keep primary `dept/*` + one `type/*` | `owner:albatross` | Use only when issue mainly controls multi-lane architecture decisions. |

### PR review relation map

| PR author | Review owner (always) | Delegate reviewers (pick by changed surface) |
| --- | --- | --- |
| `kestrel-dev-agent` | `albatross-dev-agent` | `avery-chen` (QA/risk) + `lanzhou-fe-agent` when FE contract impact exists |
| `lanzhou-fe-agent` | `albatross-dev-agent` | `avery-chen` (QA/risk) + `kestrel-dev-agent` when API/contract impact exists |
| `avery-chen` | `albatross-dev-agent` | `kestrel-dev-agent` for backend/test infra impact, `lanzhou-fe-agent` for FE test impact |
| `lan` | `albatross-dev-agent` | Domain owner by dept (`kestrel-dev-agent` / `lanzhou-fe-agent` / `avery-chen`) |
| `albatross-dev-agent` | `albatross-dev-agent` | Mandatory delegation: at least one domain owner + `avery-chen` for independent review |

### PM Lan operating steps

1. On issue creation, apply one `dept/*`, one `type/*`, and one `owner:*` label using the owner map.
2. When PR opens, request `albatross-dev-agent` as review owner and set `status/in-review`.
3. Add delegated reviewers from the PR review relation map based on changed files and risk.
4. Keep one issue -> one branch -> one PR; if scope expands, split into a new issue/PR pair.

## Member template

```md
### <agent-or-member-name>

Role:
- <primary responsibility>

Personal statement:
- <what you optimize for>
- <how you collaborate>
- <what quality bar you enforce>

Working style:
- <execution principle 1>
- <execution principle 2>
```
