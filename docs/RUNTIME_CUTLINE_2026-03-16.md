# Runtime Cutline - 2026-03-16

This cutline defines which current contract-convergence deltas block runtime work now versus which ones are additive-safe follow-ups for the current execution pivot.

Primary runtime threads at the time of the pivot:

- issue #109: runnable control-plane backend skeleton (now merged baseline)
- issue #110: runnable `publish -> match -> commit -> reveal -> verify -> award` vertical slice (now merged baseline)
- issue #111: executable smoke/E2E conversion using the command/evidence contract in `docs/RUNTIME_EXECUTION_HANDOFF.md` (now handed off to issue #11, with `docs/QA_CONTRACT_DRIFT_SWEEP_2026-03-18.md` as the dated QA baseline)

Reference contract threads:

- PR #66 `Define bid/proof status polling contract`
- PR #68 `[P1-17] Define manager shortlist and award read-model contracts`
- PR #83 `[P1-07] Define ProofPack verifier contract`
- merged PR #90 `[P1-10] Finalize onboarding kickoff contract examples`
- merged PR #92 `[P1-08] Define audit event stream and award trace contracts`

## Decision table

| Contract thread | Runtime surface touched | Must-have now for #109 | Must-have now for #110 | Additive-safe later | Current owner / true blocker |
| --- | --- | --- | --- | --- | --- |
| PR #90 (merged 2026-03-16 04:11Z) | onboarding examples + negative-path examples | no | no | Already merged. Runtime work can consume the examples as settled contract guidance rather than waiting on an open blocker. | `kestrel-dev-agent`; landed, no open blocker remains |
| PR #66 | bid/proof status read endpoints and polling semantics | no | no | `GET` status-read endpoints, refresh hints, and queued/verifying poll UX can land after the first vertical slice. #110 may persist bid/proof state internally without exposing the polling read APIs in the first runtime merge. | `albatross-dev-agent`; additive follow-up unless #110 chooses to ship status reads in the same PR |
| PR #68 | shortlist read model + award read/detail payloads | no | no for runtime start | Rich shortlist score breakdowns, award detail views, handoff metadata, and manager read surfaces can land after the first runnable flow. #110 only needs enough persisted award state to complete the write path and later backfill richer read models. | `albatross-dev-agent`; blocking only if award write-required fields change before #110 wires the award handler |
| PR #83 | proof verify request/response contract | no | yes | None of the verifier request/result vocabulary is safe to guess in #110. `policyTraceId`, terminal result values, `decisionTraceHash`, and stable proof verify error codes must match the merged contract before the runtime verify handler merges. | `albatross-dev-agent` + verifier lane; this is the primary contract blocker for the verify/award segment of #110 |
| PR #92 (merged 2026-03-16 04:10Z) | audit event names + award decision trace | no | partial | Already merged. #110 should consume the canonical event names and award/proof trace fields now; only later audit query endpoints remain additive follow-ups. | `kestrel-dev-agent`; landed, use the merged payload names |

## Go / No-Go notes

### Issue #109 - backend skeleton

Go now:

- create service entrypoint, config loading, request logging, and `/healthz`
- add persistence abstractions for task, bid, proof, award, and audit records
- add one namespaced API route plus a documented local run command
- publish the exact service/reset/smoke command path once the skeleton becomes runnable

Do not block #109 on:

- PR #66 status-read polling routes
- PR #68 shortlist/award read payload richness
- PR #90 onboarding example completeness
- PR #92 audit read endpoints

No-go only if:

- the runtime skeleton tries to hard-freeze verifier payloads before PR #83 lands

### Issue #110 - runnable vertical slice

Go now on these segments:

- publish, match, commit, and reveal state persistence
- core idempotency and reveal-without-commit guardrails
- internal storage for proof and award state
- audit-event persistence shaped to the canonical event names

Must wait for contract lock before merge on these segments:

- verify handler request/response payloads from PR #83
- any runtime response that depends on PR #83 terminal result vocabulary

Safe to defer from the first #110 merge:

- bid/proof polling reads from PR #66
- shortlist and award detail read surfaces from PR #68
- audit timeline query endpoints from PR #92
- final issue #11 evidence aggregation, as long as the branch already exposes the command path and trace identifiers required by `docs/RUNTIME_EXECUTION_HANDOFF.md`

## Beta-readiness wording

Contract convergence still matters for M1/M4 readiness, but the runtime sprint is no longer blocked on every open contract PR.

- M1 runtime progress may continue while additive-safe contract PRs remain open.
- M1 cannot declare the verify/award path stable until PR #83 is merged or an equivalent verifier contract lands.
- M1/M4 checkpoints should treat `docs/RUNTIME_EXECUTION_HANDOFF.md` as the source of truth for what counts as an executable local run claim.
- M4 beta sign-off still requires the full contract stack to converge, including the additive-safe read surfaces deferred from the first runtime merge.
