# Runtime Control Plane Skeleton

This directory holds the first runnable backend control-plane scaffold for Agent Indeed.

## Local commands

- Start the service: `npm start`
- Start with file watching: `npm run dev`
- Run the end-to-end dispatch smoke path: `npm run smoke:dispatch`
- Run the built-in runtime tests: `npm test`
- Run the bootstrap smoke flow: `npm run smoke:bootstrap`

## Boot and probe

Start the control plane in one terminal:

```bash
npm start
```

Then verify the bootstrap probes and one namespaced task route from another terminal:

```bash
curl -s http://127.0.0.1:3000/healthz
curl -s http://127.0.0.1:3000/readyz
curl -s http://127.0.0.1:3000/v1/runtime/summary
curl -s -X POST http://127.0.0.1:3000/v1/tasks   -H 'content-type: application/json'   -H 'x-workspace-id: workspace-kestrel'   -d '{
    "task": {
      "title": "Bootstrap runtime smoke",
      "description": "Persist one task through the local control plane",
      "budget": { "currency": "USD", "minAmount": 100, "maxAmount": 200 },
      "sla": { "deadlineAt": "2026-03-20T00:00:00Z", "maxLatencyMs": 5000 },
      "constraints": {
        "identityTierMin": "T1",
        "requiredSkills": ["backend", "api"]
      },
      "risk": { "level": "LOW", "valueScore": 0.2 },
      "powmPolicy": { "mode": "AUTO_TIERED", "baseDifficulty": 2 },
      "biddingWindow": {
        "commitDeadline": "2026-03-19T00:00:00Z",
        "revealDeadline": "2026-03-20T00:00:00Z"
      }
    }
  }'
curl -s http://127.0.0.1:3000/v1/tasks/task_00000001/audit-events
```

To exercise the runnable vertical slice in one command without managing a long-lived server process:

```bash
npm run smoke:dispatch
```

The smoke command boots the runtime on an ephemeral port, publishes a task, materializes candidates, commits and reveals a bid, resolves proof policy, checks award readiness, awards the task with the contract-shaped idempotent payload, and confirms the task/bid audit timelines before printing the resulting ids as JSON.

Or run the bootstrap path end-to-end with one command:

```bash
npm run smoke:bootstrap
```

That command starts the runtime on an ephemeral port, checks `/healthz`, `/readyz`, `/v1/runtime/summary`, `POST /v1/tasks`, `GET /v1/tasks/{taskId}`, and `GET /v1/tasks/{taskId}/audit-events`, then prints a final JSON summary.

## Current endpoints

- `GET /healthz` - liveness and process metadata
- `GET /readyz` - readiness plus in-memory storage checks
- `GET /v1/runtime/summary` - counts for task/bid/proof/award/audit stores
- `POST /v1/tasks` - create a task using the current contract baseline
- `GET /v1/tasks/{taskId}` - inspect a persisted task record from the runtime store
- `GET /v1/tasks/{taskId}/award` - inspect manager-facing award readiness or awarded detail for one task
- `GET /v1/tasks/{taskId}/audit-events` - inspect the runtime audit trail for one task
- `GET /v1/tasks/{taskId}/events` - inspect the full contract-shaped task event stream, with optional `bidId`, `cursor`, and `limit`
- `GET /v1/bids/{bidId}/events` - inspect the bid-scoped audit/event timeline, with optional `cursor` and `limit`
- `POST /v1/tasks/{taskId}/award` - submit the nested `CreateTaskAwardRequest` payload with `idempotencyKey`, `award.bidId`, `award.shortlistAuditId`, and `award.proofAuditId`

## Runtime behavior

- Every request emits one structured log entry with `service`, `method`, `path`, `statusCode`, `durationMs`, and `workspaceId`.
- Runtime configuration is loaded from `HOST`, `PORT`, and `SERVICE_NAME`, and invalid values fail fast during startup.
- Local shutdown on `SIGINT`/`SIGTERM` closes the HTTP listener cleanly so follow-on smoke runs can reuse the same port.

## Notes

- Storage is intentionally in-memory for the first bootstrap slice.
- IDs are deterministic, monotonic prefixes (`task_00000001`, `audit_00000001`, ...).
- Persistence abstractions now cover task, bid, proof, award, and audit entities with deterministic ids.
- This scaffold is the runtime base for the later dispatch vertical slice work.
