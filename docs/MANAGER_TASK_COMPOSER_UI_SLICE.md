# Manager Task Composer UI Slice (P1-19)

Last updated: 2026-03-14

Related issue: [#61](https://github.com/jckhang/agent-indeed/issues/61)

## Objective

Define the manager-only task composer slice so the frontend lane can ship task creation independently from shortlist and award work.

This slice stays grounded in the current contract reality:
- `TaskSpec` and `CreateTaskResponse` exist in `src/api/openapi.yaml`.
- The matching `TaskSpec`, `CreateTaskRequest`, and `CreateTaskResponse` TypeScript interfaces are now mirrored in `src/api/contracts.ts`.
- Retry-safe submit semantics such as an explicit task-create idempotency key are still a documented backend follow-up, not current contract reality.

Related planning context:
- `docs/FRONTEND_MVP_SURFACE.md`
- issue [#43](https://github.com/jckhang/agent-indeed/issues/43) for the broader manager console baseline

## Scope

In scope:
- One `Create task` page for closed-beta managers.
- Field grouping and validation hints for the current `TaskSpec` payload.
- Submit, success, and failure states for `POST /v1/tasks`.
- Explicit callouts for contract gaps that still block a durable retry UX.

Out of scope:
- Candidate shortlist rendering.
- Award summary or award command UX.
- Agent commit/reveal flows.
- Async refresh or audit timelines.

## Primary workflow

| Step | User intent | UI behavior | Contract dependency |
| --- | --- | --- | --- |
| 1 | Draft a task | Render `TaskSpec` fields in manager language with inline helper copy | `TaskSpec` |
| 2 | Fix validation issues | Highlight missing or invalid required fields before submit | `TaskSpec` + `TASK_SPEC_*` error codes |
| 3 | Submit the task | Call `POST /v1/tasks` with `CreateTaskRequest` | `CreateTaskRequest` |
| 4 | Confirm next steps | Show `taskId`, initial status, and bidding-window timestamps | `CreateTaskResponse` |
| 5 | Recover from backend rejection | Map stable policy/constraint failures into corrective guidance | `ApiErrorResponse` |

## Page structure

### 1. Task brief

Fields:
- `title`
- `description`

Behavior:
- `title` is required and stays single-purpose; avoid injecting policy or SLA notes into the title.
- `description` accepts the operational brief managers expect agents to read before bidding.

### 2. Budget and settlement

Fields:
- `budget.currency`
- `budget.minAmount`
- `budget.maxAmount`
- optional `budget.settlementModel`

Validation:
- `currency`, `minAmount`, and `maxAmount` are required.
- `minAmount <= maxAmount` must be enforced before submit.
- When only one amount is edited, the UI keeps the pair visibly linked so managers understand the allowed bid range.

### 3. SLA and timing

Fields:
- `sla.deadlineAt`
- `sla.maxLatencyMs`
- optional `sla.minSuccessRate`
- `biddingWindow.commitDeadline`
- `biddingWindow.revealDeadline`

Validation:
- `deadlineAt`, `maxLatencyMs`, `commitDeadline`, and `revealDeadline` are required.
- `commitDeadline < revealDeadline` is a blocking validation rule.
- If `deadlineAt` is earlier than `revealDeadline`, show a warning that the task cannot be fulfilled after bidding closes.

### 4. Candidate constraints

Fields:
- `constraints.identityTierMin`
- `constraints.requiredSkills`
- optional `constraints.preferredSkills`
- optional `constraints.complianceTags`

Validation:
- `identityTierMin` and at least one `requiredSkills` entry are required.
- Skill chips should distinguish hard requirements from soft preferences.
- Empty optional arrays should be omitted from the request payload instead of sent as invented placeholder values.

### 5. Risk and PoMW policy

Fields:
- `risk.level`
- `risk.valueScore`
- optional `risk.abuseSensitivity`
- `powmPolicy.mode`
- `powmPolicy.baseDifficulty`
- optional `powmPolicy.challengeType`
- optional `powmPolicy.stakeMinAmount`

Validation:
- `risk.level`, `risk.valueScore`, `powmPolicy.mode`, and `powmPolicy.baseDifficulty` are required.
- When `powmPolicy.mode=MANUAL`, the UI should keep challenge inputs expanded by default so managers review the trade-off before submit.
- `stakeMinAmount` should only be shown when the chosen challenge type can consume stake-based proof.

## Submit-state design

### Ready to submit

- Primary CTA: `Publish task`
- Secondary CTA: `Reset draft`
- CTA stays disabled until all required `TaskSpec` fields pass local validation.

### Submitting

- Lock the form to prevent duplicate clicks.
- Show a concise summary of the fields being sent so managers can confirm the task scope.
- Do not claim replay safety beyond the current contract; there is no task-create idempotency field in the API draft yet.

### Success

Render:
- `taskId`
- initial `status`
- `commitDeadline`
- `revealDeadline`
- next-step copy: `Task published. Candidate ranking becomes actionable after backend shortlist reads are available.`

### Failure

| Error code | UX treatment |
| --- | --- |
| `TASK_SPEC_CONSTRAINTS_MISSING` | Highlight the missing field group and keep the user on the form. |
| `TASK_SPEC_POLICY_INVALID` | Explain the invalid risk/policy combination and keep challenge settings expanded. |
| `TASK_CREATE_IDEMPOTENCY_CONFLICT` | Treat as a backend-contract follow-up. The current request schema does not yet expose the idempotency field needed for a reliable recovery path. |
| generic `ApiErrorResponse` | Show audit id, preserve user input, and suggest retry only when `retryable=true`. |

## API-to-UI mapping

| UI section | Current contract input/output | Status | Notes |
| --- | --- | --- | --- |
| Task brief | `TaskSpec.title`, `TaskSpec.description` | Ready | Fully present in OpenAPI and TS contracts. |
| Budget and settlement | `TaskSpec.budget.*` | Ready | UI should enforce range semantics locally. |
| SLA and timing | `TaskSpec.sla.*`, `TaskSpec.biddingWindow.*` | Ready | Date ordering constraints belong in the form layer too. |
| Candidate constraints | `TaskSpec.constraints.*` | Ready | Required skills are the main hard gate. |
| Risk and PoMW policy | `TaskSpec.risk.*`, `TaskSpec.powmPolicy.*` | Ready | Manual policy mode needs stronger review copy. |
| Submit request | `CreateTaskRequest.task` | Ready | No explicit idempotency field exists yet. |
| Success confirmation | `CreateTaskResponse.taskId`, `status`, `commitDeadline`, `revealDeadline` | Ready | Enough to unblock a first publish-only page. |
| Retry-safe replay UX | Proposed task-create idempotency support | Pending backend contract | Should be tracked separately instead of invented in UI. |

## Backend follow-up notes

P1-19 surfaces one concrete contract gap that should stay visible while manager task creation moves forward:

1. Task-create idempotency is described in earlier manager-console planning, but the current `CreateTaskRequest` contract does not expose an `idempotencyKey` field.
   - Frontend implication: the UI can prevent duplicate clicks in-session, but it cannot promise replay-safe recovery across refreshes or network ambiguity.
   - Suggested follow-up: add explicit task-create idempotency semantics in the API draft before the manager publish flow is treated as production-safe.

## Acceptance criteria mapping

| Acceptance criterion | How this slice covers it |
| --- | --- |
| Manager task composer covers the current `TaskSpec` fields needed for MVP task creation. | The page structure maps every currently defined `TaskSpec` section into a dedicated form group with field-level behavior notes. |
| Validation hints and blocking states are rendered for missing/invalid required fields. | Required-field, ordering, and policy-specific blocking rules are defined for each form section plus stable error-code handling. |
| Submission flow documents any backend contract mismatch found during implementation instead of silently inventing fields. | The doc explicitly calls out the missing task-create idempotency contract instead of treating it as already available. |
| Scope stays focused on task creation and does not absorb shortlist/award UI work. | Candidate review and award behavior remain explicitly out of scope and continue to live in separate follow-on issues. |
