# Hiring Plan for MVP Delivery

Last updated: 2026-03-13

## Hiring Objective

Close delivery-critical role gaps so Phase 1 MVP can ship on schedule with minimal team friction.

## Baseline Team Assumption

- Current active role: architecture lead/coordinator
- Missing execution capacity in frontend, backend integration, and quality operations

## Role Gap Matrix

| Priority | Role | Headcount | Why now | Hiring target |
| --- | --- | --- | --- | --- |
| P0 | Backend Engineer (API + Workflow) | 1 | Critical path for commit/reveal, PoMW, audit | Offer accepted within 2 weeks |
| P0 | Frontend Engineer (MVP Console) | 1 | Required for manager/agent closed-beta usability | Offer accepted within 2 weeks |
| P1 | QA/Automation Engineer | 1 | Needed for E2E reliability and release confidence | Start by Week 3 |
| P1 | DevOps/SRE (part-time or shared) | 0.5-1 | Needed for observability/release baseline | Assign by Week 3 |

## Role Profiles for HR

### Backend Engineer (P0)

Mission:
- Own control-plane APIs and state transitions for onboarding, bidding, proof, and audit.

Must-have:
- API design and implementation experience (OpenAPI-first preferred).
- Strong data modeling and idempotency/error-handling skills.
- Experience with event/audit-oriented backend flows.

30/60/90 expectations:
- 30d: onboard and deliver one core API slice with tests.
- 60d: own commit/reveal + proof verify integration path.
- 90d: stabilize auditability and production-readiness checklist.

### Frontend Engineer (P0)

Mission:
- Build manager/agent MVP consoles that map directly to backend contracts.

Must-have:
- Strong TypeScript frontend engineering.
- Form/state management and API integration rigor.
- Ability to implement validation/error UX for complex workflows.

30/60/90 expectations:
- 30d: task publish and candidate view baseline.
- 60d: bid commit/reveal and proof status flow.
- 90d: audit timeline and release hardening.

### QA/Automation Engineer (P1)

Mission:
- Build and maintain E2E coverage for the full MVP lifecycle and key abuse paths.

Must-have:
- API and UI test automation experience.
- Ability to design deterministic negative-path test suites.

### DevOps/SRE (P1)

Mission:
- Establish baseline CI/CD, observability, and release safety gates.

Must-have:
- CI pipelines, logs/metrics/tracing setup, and incident response fundamentals.

## Interview Loop Suggestion

1. Recruiter screen (role fit + delivery pace expectations).
2. Technical interview (API/state modeling for backend; workflow UI for frontend).
3. Practical case (small scoped implementation or architecture exercise).
4. Architecture lead interview (cross-team collaboration and MVP prioritization).
5. Final culture and ownership alignment.

## Candidate Evaluation Rubric (1-5)

- Delivery ownership and speed
- Architecture quality under MVP constraints
- Contract-first collaboration ability
- Debugging and production reliability mindset
- Written communication and documentation clarity

## Recruiting Artifacts for HR

- Use this file as the source for JD drafts.
- Convert each role profile into one public job post and one internal scorecard.
- Link open role issues from `docs/issues/PHASE1_ISSUES.md` for status tracking.
