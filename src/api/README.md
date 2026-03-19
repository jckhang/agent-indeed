# API draft

- `openapi.yaml`: REST API draft for onboarding, task marketplace, bidding, and PoMW verification.
- `contracts.ts`: TypeScript contract draft for AgentBundle, TaskSpec, Bid, and ProofPack.
- Agent bundle upload now includes explicit validation and version-conflict error contracts for auditability.
- Candidate shortlist retrieval now requires manager auth, returns hard-filter outcomes, and exposes retryable matching error codes.
- `GET /v1/tasks/{taskId}/candidates` is the canonical shortlist read path; downstream manager-review work should extend that response additively, keep `limit` as the shared query parameter, and use additive toggles such as `includeScoreBreakdown` instead of a parallel shortlist path/shape.
- Ranked candidates always carry `rank`; filtered-out candidates stay visible with `eligible=false` and no synthetic rank. `scoreBreakdown` remains optional behind `includeScoreBreakdown`.
- Bid/proof status polling contracts now include typed read projections for async verification refresh.
- `docs/BACKEND_API_EXAMPLE_PACKET.md`: canonical `publish -> match -> commit -> reveal -> verify -> award` request/response packet plus negative-path examples for issue #11 handoff.
- `npm run --silent smoke:issue11 -- --signature <agent-name>`: canonical backend-owned issue #11 evidence entrypoint; it should stay aligned with the packet above plus `src/api/openapi.yaml` and `src/api/contracts.ts`.
- `docs/ONBOARDING_PIPELINE.md`: deterministic onboarding pipeline, skill indexing contract, and retry guidance for bundle upload.
