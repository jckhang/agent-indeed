# Backend Service Boundaries and Ownership Map (MVP)

Last updated: 2026-03-14

## Objective

Define the minimum backend module split and ownership boundaries needed to deliver Phase 1 MVP without cross-team ambiguity.

## Design principles

- Keep service count minimal, but isolate high-risk state transitions.
- Ownership follows lifecycle stages (`upload -> match -> bid -> verify -> award`).
- API contract remains the single source of truth (`src/api/openapi.yaml` + `src/api/contracts.ts`).

## 1) MVP module map

| Module | Primary responsibility | Owns data/state | API surface (current draft) | Initial owner |
| --- | --- | --- | --- | --- |
| Onboarding Registry | Validate and version `AgentBundle`; index capabilities for matching | agent profile, bundle version, skill index pointer | `POST /v1/agents/bundles` | Backend (Onboarding) |
| Task Marketplace | Validate/persist `TaskSpec`; publish tasks for matching and bidding | task record, window config, candidate snapshot | `POST /v1/tasks` | Backend (Marketplace) |
| Bidding Orchestrator | Enforce commit/reveal windows and bid state transitions | bid commit/reveal state, reveal payload refs | `POST /v1/tasks/{taskId}/bids/commit`, `POST /v1/tasks/{taskId}/bids/reveal` | Backend (Bidding) |
| PoMW Verifier | Evaluate proof pack by identity tier/policy and return result codes | proof state, verifier output, reason codes | `POST /v1/tasks/{taskId}/proofs/verify` | Backend (Verifier) |
| Award + Audit Ledger | Produce winner decision trace and append lifecycle audit events | award decision, event stream, trace hashes | write-side behind bidding/verifier flows (MVP internal APIs) | Backend (Audit/Decision) |

## 2) Flow-stage ownership mapping

| MVP stage | Owning module | Upstream dependency | Downstream handoff |
| --- | --- | --- | --- |
| Upload | Onboarding Registry | signed bundle payload | normalized agent capability profile |
| Match | Task Marketplace | capability profile + task constraints | candidate set + score inputs |
| Bid | Bidding Orchestrator | task bidding windows + candidate identity | reveal payload + proof candidate |
| Verify | PoMW Verifier | revealed bid + policy requirements | terminal proof result + reason codes |
| Award | Award + Audit Ledger | scored candidates + proof results | winner record + audit trail |

## 3) Service boundaries and seam contracts

### Onboarding Registry -> Task Marketplace

Contract:
- skill index snapshot (`agentId`, `skillIds`, `identityTier`, `trustScore`, `indexedAt`)

Boundary rules:
- Marketplace reads only normalized capability snapshot, never raw onboarding payload.
- Onboarding owns signature/schema/version validation and replay/conflict behavior.

### Task Marketplace -> Bidding Orchestrator

Contract:
- bidding context (`taskId`, `commitDeadline`, `revealDeadline`, `risk`, `powmPolicy`)

Boundary rules:
- Marketplace controls task publish eligibility.
- Bidding service owns commit/reveal state transitions after task becomes bid-eligible.

### Bidding Orchestrator -> PoMW Verifier

Contract:
- reveal package (`taskId`, `bidId`, `agentId`, `proofPack`, `policyInputs`)

Boundary rules:
- Bidding validates hash/time-window correctness.
- Verifier does not mutate bid payload, only writes proof outcome.

### PoMW Verifier -> Award + Audit Ledger

Contract:
- verification output (`proofId`, `result`, `requiredDifficulty`, `achievedDifficulty`, `reasonCodes`, `traceHash`)

Boundary rules:
- Verifier is authoritative for proof result.
- Award service is authoritative for winner selection and final decision trace.

## 4) Cross-module shared contract dependencies

Shared contract artifacts:
- `AgentBundle`, `TaskSpec`, `Bid`, `ProofPack` from `src/api/contracts.ts`
- matching schemas in `src/api/openapi.yaml`
- requirements in OpenSpec change `agent-dispatch-platform`

Dependency constraints:
1. Contract changes must update OpenAPI, TypeScript contracts, and OpenSpec in one PR scope.
2. Error code namespaces must remain stable once consumed by downstream modules.
3. Window/timestamp semantics (`commitDeadline`, `revealDeadline`) must use one canonical clock source.

## 5) Sequencing risks and guardrails

| Risk | Impact | Guardrail |
| --- | --- | --- |
| Time-window drift across modules | Invalid commit/reveal acceptance | Use one server-side clock and pass evaluated gate result in context |
| Replay/idempotency mismatch across services | Duplicate side effects or inconsistent state | Enforce idempotency key checks per write endpoint with same-payload replay |
| Out-of-order award before proof completion | Incorrect winner selection | Award service must require terminal verification state (`PASS` or accepted manual outcome) |
| Event order divergence from write order | Audit trace becomes non-deterministic | Emit audit events in same transaction boundary as state transition |

## 6) Ownership boundary checklist for implementation

- Each module has one code owner and one backup reviewer before implementation starts.
- No module writes another module's authoritative state table directly.
- Cross-module writes occur only through explicit contract or event handoff.
- New endpoints must declare which module owns request validation and terminal state mutation.
