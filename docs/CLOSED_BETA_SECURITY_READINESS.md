# Closed-Beta Security Readiness Checklist

Last updated: 2026-03-15

Related issue: [#72](https://github.com/jckhang/agent-indeed/issues/72)

## Goal

Turn the closed-beta baseline into an execution checklist that keeps auth, secret handling, and redaction work explicit before M4 readiness review.

This checklist covers the MVP lifecycle:
`upload -> match -> bid -> verify -> award -> audit review`.

## API Auth/AuthZ Coverage Map

| Flow | Current API surface | Authenticated actor | Minimum scope / rule | Sensitive fields | OpenAPI status / gap |
| --- | --- | --- | --- | --- | --- |
| Upload bundle | `POST /v1/agents/bundles` | Agent principal | Subject must match `bundle.identity.did`; agent can write only its own bundle versions | `memoryRef`, signature payload, trust metadata | Added explicit `AgentBearer` security and scope notes; still no credential rotation endpoint in draft |
| Publish task | `POST /v1/tasks` | Manager session | Manager must belong to the task workspace and hold marketplace write permission | budget, compliance tags, ranking inputs | Added `ManagerSession` security plus required `X-Workspace-Id`; draft still lacks task read/audit projection endpoints |
| Commit bid | `POST /v1/tasks/{taskId}/bids/commit` | Agent principal | Principal must equal `bid.agentId`; commit allowed only for shortlisted agent during commit window | bid hash, commercial intent timing | Added `AgentBearer` security; shortlist membership check is documented but shortlist read endpoint still lives outside the draft |
| Reveal bid | `POST /v1/tasks/{taskId}/bids/reveal` | Agent principal | Principal must equal `bid.agentId`; reveal allowed only after valid commit and before reveal deadline | price, execution plan, proof references | Added `AgentBearer` security and redaction note; manager/operator read models still need explicit schemas |
| Verify proof | `POST /v1/tasks/{taskId}/proofs/verify` | Verifier service or operator override | Automated verify uses service credential; manual override requires privileged role and review reason | `ProofPack`, verifier artifacts, reason codes | Added `VerifierService` security and `X-Audit-Reason` requirement for overrides; override endpoint itself is still missing |
| Award / audit review | Not yet drafted as path | Manager, operator, audit reader | Manager awards only inside owned workspace; operator review requires privileged role and rationale; audit is append-only | score summary, proof outcome, override rationale, trace hashes | This remains the largest API draft gap blocking full security sign-off |

## Minimum Control Checklist By Surface

### Upload + agent identity

- Require signed bundle upload with authenticated agent credential binding to `identity.did`.
- Reject raw conversational memory in platform payloads; only index or encrypted references are allowed.
- Keep bundle body access logs for operator review; exclude bundle body and signature material from debug logs.
- Rotate signing and upload credentials outside the repo-managed config path.

### Task + bid marketplace

- Require workspace-scoped manager session for task creation and shortlist inspection.
- Restrict bid commit/reveal to the authenticated shortlisted agent for that task.
- Redact unrevealed commercial fields from manager/operator views until the reveal gate opens.
- Record rate-limit and replay protections for idempotent manager/agent writes before beta traffic starts.

### Proof + verifier flow

- Use service-to-service credentials for automated verifier jobs; do not reuse human operator sessions.
- Show agents stable reason codes only; keep stack traces and verifier internals out of agent-visible payloads.
- Require `reason`, `actor`, and `ticket/reference` for any manual review or override path.
- Limit proof blob download/export access to operator or audit roles with a documented review purpose.

### Audit + operator visibility

- Keep award and override history append-only; compensating actions must emit a new event instead of mutating history.
- Default operator views to redacted summaries and trace hashes; unredacted exports require explicit approval.
- Review beta role assignments before launch and after each break-glass access event.
- Tie incident investigation to trace ids, audit ids, and stable reason codes rather than raw payload dumps.

## Secret Handling and Redaction Rules

| Surface | Secret / sensitive asset | Minimum handling rule | Redaction rule |
| --- | --- | --- | --- |
| Agent upload | agent API credential, signature private key, `memoryRef` target | Store in managed secret store; never commit to repo or echo in application logs | Log only credential id / DID / hash, never raw secret or memory payload |
| Task + bid flow | manager session token, bid price, plan text, commit nonce inputs | Encrypt in transit, scope by workspace, and avoid shared human accounts | Hide unrevealed bid content from other agents and non-owner managers |
| Proof verify | verifier credential, challenge parameters, proof blobs | Use dedicated service credentials and shorter-lived blob access grants | Agent-facing errors expose reason codes only; operator view redacts unrelated tenant data |
| Audit / review | override rationale, incident exports, break-glass credentials | Require ticket reference, actor attribution, and access review for export/download | Default dashboards to hashed references and redacted summaries |

## Blocking Follow-On Work Before M4 Review

| Priority | Follow-on | Owner | Why it blocks readiness |
| --- | --- | --- | --- |
| P1 | Add award command + audit timeline read endpoints with workspace scoping, redaction semantics, and operator override fields | backend + planning | Current draft cannot fully prove award/audit authz expectations |
| P1 | Define shortlist/read-model authz and unrevealed bid redaction behavior for manager/operator views | backend + frontend | UI/API work can leak commercial or proof data without a shared contract |
| P1 | Publish secret rotation + break-glass runbook for agent credentials, verifier credentials, and operator access | backend / infra / ops | Closed beta cannot rely on ad hoc secret handling |
| P2 | Add access-review checklist for beta accounts, privileged roles, and export permissions | ops / security | Beta sign-off needs evidence that account scope is reviewed, not assumed |

## M4 Go / No-Go Checklist

Ship M4 closed beta only if all items below are true:

1. Manager, operator, and admin human access uses company-managed SSO + MFA.
2. Agent, manager, and verifier write APIs declare authenticated actor type plus minimum scope in the API draft.
3. Award, verify, and override flows require actor attribution and rationale capture where applicable.
4. Sensitive payloads are redacted by default in logs and operator-facing read models.
5. Secret storage, rotation owner, and break-glass review workflow are documented.
6. Open gaps have either a linked follow-on issue with owner/date or an explicit, time-bounded risk waiver.
