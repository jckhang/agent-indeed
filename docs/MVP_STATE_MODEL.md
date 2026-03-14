# MVP State Model and Write Sequencing

Last updated: 2026-03-14

## Objective

Freeze the minimum state and write-order rules needed to keep the MVP loop deterministic:
`upload -> match -> bid -> verify -> award`.

This baseline is intentionally small and is meant to unblock P1-03 to P1-08 execution.

## Scope

- Entity state model for task, bid, proof, and audit artifacts.
- Out-of-order transition rejection rules.
- Write sequencing and idempotency rules for commit/reveal/verify/award.

## 1) Entity State Model

### Task state (control plane)

| State | Meaning | Entry trigger | Exit trigger |
| --- | --- | --- | --- |
| `OPEN_FOR_MATCHING` | Task accepted and visible for candidate retrieval | `POST /v1/tasks` succeeds | matching ready + bidding window accepted |
| `OPEN_FOR_BIDDING` | Task accepts bid commits/reveals by time-window gates | publish flow enables bidding | reveal window ends and at least one valid reveal exists |
| `VERIFYING` | Proof verification and scoring in progress | reveal window closed | verification/scoring finalized |
| `AWARDED` | Winner selected and decision trace persisted | award transaction commits | terminal |
| `CLOSED_NO_AWARD` | No valid winner (timeout/rejection/manual close) | award preconditions fail or operator closes task | terminal |

Notes:
- Current API draft already exposes `OPEN_FOR_MATCHING` and `OPEN_FOR_BIDDING`.
- `VERIFYING`, `AWARDED`, and `CLOSED_NO_AWARD` are required to avoid implicit state from side effects.

### Bid state (per `taskId + agentId`)

| State | Meaning | Allowed next | Terminal |
| --- | --- | --- | --- |
| `COMMITTED` | Commit hash accepted during commit window | `REVEALED`, `REJECTED` | no |
| `REVEALED` | Reveal payload accepted and linked to commit | `SCORED`, `REJECTED` | no |
| `SCORED` | Ranking/decision score materialized | none | yes |
| `REJECTED` | Commit/reveal invalid or policy gate failed | none | yes |

### Proof state (per `proofId`)

| State | Meaning | Allowed next | Terminal |
| --- | --- | --- | --- |
| `PENDING_VERIFY` | Proof accepted and queued for verifier | `PASS`, `FAIL`, `MANUAL_REVIEW` | no |
| `PASS` | Proof meets required difficulty and policy checks | none | yes |
| `FAIL` | Proof does not satisfy required checks | none | yes |
| `MANUAL_REVIEW` | Automatic verifier cannot conclude safely | none (manual action required) | yes |

### Audit state (append-only)

Audit is modeled as append-only events with strict ordering per `taskId`.

Required events (minimum):
- `TASK_CREATED`
- `BID_COMMITTED`
- `BID_REVEALED`
- `POMW_VERIFIED`
- `TASK_AWARDED`

Each event must include:
- `eventId`, `taskId`, `occurredAt`, `actorId/system`, `traceHash`, `payloadVersion`.

## 2) Invalid Transition Rejection Rules

| Operation | Rejection condition | Expected result |
| --- | --- | --- |
| Commit | Task not in `OPEN_FOR_BIDDING` or commit window closed | `409 BID_COMMIT_WINDOW_CLOSED` |
| Commit | Duplicate commit on same `taskId + agentId` with different payload hash | `409 BID_COMMIT_PAYLOAD_CONFLICT` |
| Reveal | No prior valid commit | `400 BID_REVEAL_COMMIT_MISSING` |
| Reveal | Reveal window closed | `409 BID_REVEAL_WINDOW_CLOSED` |
| Reveal | Reveal hash does not match committed hash | `400 BID_REVEAL_HASH_MISMATCH` |
| Verify | Bid not in `REVEALED` | `409 PROOF_VERIFY_BID_NOT_REVEALED` |
| Award | Any candidate lacks completed verification (`PASS` or accepted manual decision) | `409 AWARD_VERIFY_INCOMPLETE` |
| Award | Task already awarded | idempotent replay or `409 TASK_ALREADY_AWARDED` |

## 3) Write Sequencing (Deterministic Order)

### Commit sequence

1. Load task and evaluate commit window gate.
2. Acquire logical lock on key `(taskId, agentId)`.
3. Insert commit record with hash + metadata (or replay existing by idempotency key).
4. Emit `BID_COMMITTED` audit event in the same transaction boundary.

### Reveal sequence

1. Load commit record by `(taskId, agentId)`.
2. Validate reveal window gate and hash match.
3. Persist reveal payload and set bid state to `REVEALED`.
4. Create proof record with state `PENDING_VERIFY`.
5. Emit `BID_REVEALED` audit event.

### Verify sequence

1. Accept `proofId` only when bid state is `REVEALED`.
2. Execute policy + verifier checks and persist terminal proof state.
3. Materialize verification reason codes and difficulty fields.
4. Emit `POMW_VERIFIED` audit event.

### Award sequence

1. Lock task row to enforce single award writer.
2. Read candidate set with terminal proof states.
3. Compute ranking and persist winner + decision trace hash.
4. Transition task to `AWARDED` (or `CLOSED_NO_AWARD` if no valid winner).
5. Emit `TASK_AWARDED` audit event.

## 4) Idempotency and Anti-race Baseline

### Idempotency contract

- Commit/reveal/verify/award must accept client idempotency keys.
- Same key + same payload: return original result (no duplicate side effects).
- Same key + different payload: reject with `409 IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.

### Data constraints

- Unique commit key: `(task_id, agent_id)`.
- Unique reveal key: `(task_id, agent_id)`.
- Unique proof key: `(proof_id)`.
- Unique award key: `(task_id)` where task state is terminal awarded path.

### Locking order

Use stable lock order to avoid deadlocks:
`task -> bid -> proof -> award_decision`.

## 5) Direct Follow-on for P1 Issues

- #5 (`TaskSpec`): must carry windows needed for deterministic commit/reveal gates.
- #7 (commit/reveal APIs): must implement rejection codes and idempotent replay behavior above.
- #8 (PoMW policy engine): must output verifier parameters consumed by `PENDING_VERIFY -> terminal` transitions.
- #9 (Proof verifier): must return stable reason codes aligned to `PASS/FAIL/MANUAL_REVIEW`.
- #10 (audit + award trace): must persist ordered lifecycle events and decision trace hash.

## Out of Scope

- Settlement/payment state machines.
- Reputation write-back scoring internals.
- Multi-tenant policy override state.
