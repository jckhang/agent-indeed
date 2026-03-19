# Onboarding Runtime Handoff

Last updated: 2026-03-19

## Goal

Define one review and evidence workflow for the executable agent onboarding upload
slice tied to epic #2. This keeps backend, QA, and planning aligned once a
branch introduces `POST /v1/agents/bundles` and its local smoke path.

Use this document when a PR claims that the onboarding runtime path is runnable.
Keep live pass/fail state in the relevant PR and issue threads; use this file as
an execution contract, not as a status board.

## When This Applies

Treat this handoff as required when a branch adds or changes any of the
following:

- the runtime handler for `POST /v1/agents/bundles`
- bundle replay, version-conflict, or payload-hash mismatch semantics
- skill-indexing output returned from the upload path
- onboarding smoke commands or their expected output shape
- planning docs that claim the onboarding upload path is executable

## Required Sync Before Review

Before asking for review, confirm that the branch keeps the onboarding slice
consistent across these sources:

| Surface | What must stay aligned |
| --- | --- |
| `openspec/changes/agent-dispatch-platform/` | Scope, acceptance, and rollout notes for the onboarding runtime slice |
| `src/api/openapi.yaml` | request/response and error-code vocabulary for bundle upload |
| `src/api/contracts.ts` | TypeScript contract names, enums, and response shapes |
| `docs/ONBOARDING_PIPELINE.md` | deterministic validation, replay, and conflict rules |
| runtime/tests | executable handler plus local smoke/assertion coverage |

## Minimum Validation Contract

A PR that lands the onboarding runtime slice should publish literal output for
all of these commands in the PR body or a signed follow-up comment:

1. `openspec validate --all`
2. `npm test`
3. `npm run check:contract-drift`
4. `npm run smoke:onboarding`
5. `git diff --check`
6. `bash scripts/agent_prepush_check.sh --github-user <github-user>`

If one command is intentionally skipped, record `not run: <reason>` verbatim so
reviewers know the omission is deliberate rather than missing evidence.

## Minimum Smoke Evidence

The onboarding smoke output should show one accepted upload and the two MVP
negative/replay checkpoints that planning and QA care about most:

| Scenario | Expected signal |
| --- | --- |
| First upload accepted | stable `agentId`, `version`, and indexed skill summary |
| Same payload replayed | `RETURN_EXISTING_ON_HASH_MATCH` or equivalent replay marker |
| Payload hash mismatch | `AGENT_BUNDLE_SIGNATURE_PAYLOAD_MISMATCH` or the published contract equivalent |

If the branch changes conflict behavior, include the version-conflict path too,
but do not drop the three baseline checkpoints above.

## PR Body Handoff Shape

Keep the onboarding slice reviewable with this structure:

### Acceptance criteria mapping
- epic #2 upload/runtime claim advanced by ...
- onboarding deterministic rules preserved in `docs/ONBOARDING_PIPELINE.md`
- OpenSpec/OpenAPI/contracts/runtime tests stay synchronized

### QA steps
- run the six validation commands in order
- record the onboarding smoke happy path, replay path, and payload-hash mismatch
- note the exact expected result/error code for each step

### Risk / rollback
- state whether persistence is still in-memory or durable
- call out any signature-validation shortcuts that remain format-only
- describe the single revert/disable step if the upload route must be backed out

## GitHub Write-Back Rules

Use GitHub as the live record after validation:

- Link the implementation PR from epic [#2](https://github.com/jckhang/agent-indeed/issues/2) when the onboarding slice meaningfully changes the MVP cutline.
- Post the literal validation block on the PR before asking QA or planning to reuse the command path.
- If QA needs the onboarding smoke output for a broader beta-readiness pass, point them at the signed PR evidence first instead of copying partial transcripts into repo docs.
- Keep signatures on PR comments and review replies in the form `--albatross-dev-agent` when planning posts the handoff note.

## Review Questions

Reviewers should be able to answer these without reconstructing the branch by
hand:

1. Does the branch keep the published upload contract and runtime behavior in sync?
2. Can a reviewer rerun one local command path and observe create, replay, and mismatch behavior?
3. Is the remaining gap clearly called out as runtime durability, cryptographic verification depth, or QA follow-through rather than vague "future work"?
4. Is the evidence posted in the PR thread instead of buried only in local notes?
