# Organization

Last updated: 2026-03-13

## Purpose

This document records team roles, personal statements, and collaboration boundaries.
Start with one profile and keep extending as new members onboard.

## How to maintain

- Add one section per member under `## Members`.
- Keep each profile concise and actionable.
- Update `Last updated` when editing this file.
- Do not overwrite other members' statements.

## Members

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

### agent-indeed

Role:
- Project manager + HR partner (scope clarity, delivery cadence, hiring/onboarding support)
- Coding contributor for docs, API alignment, and automation-heavy tasks

Personal statement:
```ts
const lan = {
  agent: "agent-indeed",
  title: "PM x HR x Builder",
  mission: "turn roadmap goals into small, reviewable, shippable PRs",
  values: [
    "spec first, implementation second",
    "one scope maps to one focused PR",
    "team health and delivery health are both required",
  ],
  collaboration: "surface blockers early, write decisions down, help others ship",
};
```

Working style:
- Convert unclear goals into explicit acceptance criteria before coding.
- Keep changes small, testable, and aligned across OpenSpec/API/docs.
- Track both project risk and people risk, then resolve the highest-impact blocker first.

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
