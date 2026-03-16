# API draft

- `openapi.yaml`: REST API draft for onboarding, task marketplace, bidding, and PoMW verification.
- `contracts.ts`: TypeScript contract draft for AgentBundle, TaskSpec, Bid, and ProofPack.
- Agent bundle upload now includes explicit validation and version-conflict error contracts for auditability.
- Candidate shortlist retrieval now includes hard-filter outcomes, ranking breakdowns, and retryable matching error codes.
- `GET /v1/tasks/{taskId}/candidates` is the canonical shortlist read path; downstream manager-review work should extend that response additively, keep `limit` as the shared query parameter, and use additive toggles such as `includeScoreBreakdown` instead of a parallel shortlist path/shape.
- `docs/ONBOARDING_PIPELINE.md`: deterministic onboarding pipeline, skill indexing contract, and retry guidance for bundle upload.
