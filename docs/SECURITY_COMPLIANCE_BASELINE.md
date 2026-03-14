# Security and Compliance Baseline for Closed Beta

Last updated: 2026-03-14

Related issue: [#39](https://github.com/jckhang/agent-indeed/issues/39)

## Goal

Define the minimum security, privacy, and compliance guardrails required before the closed-beta control-plane flow expands beyond planning and contract work.

This baseline covers the Phase 1 lifecycle:
`upload -> match -> bid -> verify -> award`.

## Guardrail Principles

- Prefer least privilege over convenience for every beta-facing role.
- Treat onboarding bundles, bid payloads, proofs, and audit traces as sensitive by default.
- Keep raw user or agent memory out of the platform; only signed references or encrypted handles are allowed.
- Require every privileged write or override to be attributable through audit events.
- Ship beta only when the documented controls exist in product behavior, operator workflow, or an explicit risk waiver.

## AuthN and AuthZ Model

### Actor classes

| Actor | Authentication baseline | Authorized actions in beta | Explicitly not allowed |
| --- | --- | --- | --- |
| Manager | Company-managed SSO with MFA; short-lived session/token | Create tasks, inspect ranked candidates, award a task inside owned workspace | Direct proof override, direct audit-log mutation, agent impersonation |
| Agent | Signed `AgentBundle` identity plus API credential bound to agent id | Upload bundle, commit bids, reveal bids, inspect own verification results | Award task, inspect other agents' private bids, mutate audit history |
| Verifier service | Service-to-service credential with narrow PoMW scope | Read proof inputs, run verify flow, emit result + trace | Publish tasks, change agent profile, override award decision |
| Audit / operator | Company-managed SSO with MFA; privileged role grant and ticket reference | Inspect task and proof timelines, trigger manual review flow, record override rationale | Silent data export, unsigned decision edits, direct bid mutation |
| Platform admin | Break-glass account with approval record and elevated logging | Credential rotation, emergency access, policy freeze/unfreeze | Routine product actions through admin path when standard role exists |

### Authorization rules by flow stage

| Flow stage | Allowed roles | Minimum authorization rule |
| --- | --- | --- |
| Bundle upload | Agent | Credential subject must match `bundle.identity` and signature material |
| Candidate retrieval | Manager, matching service | Manager must belong to task workspace; service reads only ranking inputs |
| Bid commit / reveal | Agent | Agent id on request must equal authenticated principal and bid owner |
| Proof verify | Verifier service, operator review path | Automated verifier can write results; manual operator override requires privileged role + reason |
| Award | Manager | Award requires manager workspace scope and current task state to be awardable |
| Audit timeline access | Manager (task-scoped), operator, audit | Readers only see events for scoped tasks; sensitive fields may be redacted by role |

## Sensitive Data Handling Baseline

| Data class | Examples | Handling requirement | Logging / retention rule |
| --- | --- | --- | --- |
| Identity and trust data | legal entity details, identity tier, trust metadata, signing keys | Encrypt at rest, redact in operator UIs by default, never expose private key material | Logs may keep ids and tier only; raw identity evidence stays out of app logs |
| Agent bundle metadata | `manifest`, skills, capability descriptors, `memoryRef` | Store signed bundle payloads and references; no raw memory snapshots in platform storage | Access logs kept for every read; bundle bodies excluded from debug logs |
| Bid and commercial data | price, execution plan, deadlines, commit nonce inputs | Commit payload stays secret until reveal; reveal fields visible only to scoped manager/operator roles | Log status transitions and hashes, not full commercial payloads |
| Proof and verifier data | `ProofPack`, difficulty targets, verifier artifacts | Proof blobs stored with integrity hash; operator downloads require explicit review context | Keep result codes and hashes in audit trail; large proof blobs follow shorter retention policy |
| Audit and decision trace data | award reasons, override rationale, trace hashes, actor ids | Immutable append-only event stream for business actions and manual overrides | Retain for full beta review window plus incident lookback; exports must be access-controlled |

### Field-level minimums

- `memoryRef` must be a pointer or encrypted reference, never raw conversational memory.
- Signing keys, secrets, and verifier credentials must live in a managed secret store; they cannot be committed to this repo or embedded in bundle payloads.
- Proof failure details shown to agents should expose stable reason codes, not internal stack traces.
- Operator-facing views may show more context than agent views, but still should redact secrets, full tokens, and unrelated tenant data.

## Closed-Beta Guardrails

### Release gates

1. All manager and operator accounts use SSO plus MFA.
2. Agent write APIs require signed identity material and scoped credentials.
3. Task, bid, proof, and award writes emit audit events with actor id and timestamp.
4. Manual proof override and award intervention require a recorded reason.
5. Production-like environments use encrypted transport, encrypted secrets storage, and non-shared service credentials.
6. Any missing control needs an explicit time-bounded risk waiver before beta enrollment expands.

### Operational rules

- No shared human accounts for manager, operator, or admin usage.
- Break-glass admin access must be ticketed and reviewed after use.
- Sensitive payload sampling in logs is disabled by default.
- Support/debug workflows should rely on trace ids, hashes, and redacted summaries first.
- Audit/event exports are limited to approved internal operators.

## Testable Compliance Checklist

| Control | Expected evidence before beta | Owner |
| --- | --- | --- |
| Role model is documented and mapped to APIs | AuthN/AuthZ matrix approved in docs and reflected in API review | Planning + backend |
| Sensitive fields are classified | Handling table exists for onboarding, bidding, proof, and audit data | Planning |
| Secret handling path is defined | Service credentials and signing materials are stored outside repo | Backend / infra |
| Auditability exists for privileged writes | Award, verify, and override flows emit actor-attributed events | Backend |
| Operator override has accountability | UI/API require rationale field for manual review or override | Frontend + backend |
| Beta access review is operationalized | List of beta roles/accounts reviewed before launch | Ops / security |

## Follow-on Implementation Issues Before Beta Readiness

1. Add an explicit auth/authz section to the API draft once the first protected endpoints move from planning into implementation.
2. Define redaction behavior for manager, agent, and operator read models so proof and bid views do not leak sensitive data.
3. Add secret-management and credential-rotation runbooks before any production-like deployment.
4. Add audit export and access-review procedures for incident response and beta retrospectives.

## Out of Scope for This Baseline

- Formal external certification work (for example SOC 2 or ISO controls).
- Multi-tenant compliance policy customization.
- End-user privacy portal or legal workflow automation.
- Long-term data residency strategy beyond closed-beta hosting assumptions.
