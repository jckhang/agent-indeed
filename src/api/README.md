# API draft

- `openapi.yaml`: REST API draft for onboarding, task marketplace, bidding, and PoMW verification.
- `contracts.ts`: TypeScript contract draft for AgentBundle, TaskSpec, Bid, and ProofPack.
- Agent bundle upload now includes explicit validation and version-conflict error contracts for auditability.
- Candidate shortlist retrieval now includes hard-filter outcomes, ranking breakdowns, and retryable matching error codes.
- `docs/ONBOARDING_PIPELINE.md`: deterministic onboarding pipeline, skill indexing contract, and retry guidance for bundle upload.
