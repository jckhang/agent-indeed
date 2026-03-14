# Agent Onboarding Pipeline

Last updated: 2026-03-14

## Goal

Define the MVP control-plane pipeline for `POST /v1/agents/bundles` so backend,
API, and matching work all share one deterministic onboarding contract.

## Pipeline Stages

| Stage | Check | Output |
| --- | --- | --- |
| 1. Idempotency gate | Look up `idempotencyKey` within the caller's identity scope before mutating state. | Replay existing success response when the same request is retried. |
| 2. Signature verification | Verify `signature.signerDid == identity.did`, confirm `payloadHash`, then validate the cryptographic signature. | Reject invalid or mismatched signatures with stable audit-friendly error codes. |
| 3. Schema validation | Validate required fields, field formats, and supported bundle version rules. | Reject invalid payloads with `fieldPath`, rule, expected, and actual details. |
| 4. Version conflict policy | Compare `(agent identity, manifest.version, payloadHash)` with stored bundle metadata. | Return existing version on hash match; reject on hash mismatch. |
| 5. Bundle persistence | Persist manifest, identity, memory boundary metadata, and accepted bundle version record. | Produce canonical `agentId` and accepted `version`. |
| 6. Skill indexing | Expand each `skills[]` entry into matching-ready index records. | Matching can hard-filter by `skillId` and version without reading raw bundle artifacts. |
| 7. Response assembly | Return success or replay payload including indexing summary. | Clients can confirm what the backend accepted and indexed. |

## Deterministic Rules

- Validation order is fixed: idempotency -> signature -> schema -> version
  conflict -> persistence -> indexing.
- `signature.payloadHash` is computed from the canonical bundle body
  (`schemaVersion`, `manifest`, `identity`, `skills`, `memoryRef`) before the
  `signature` block is attached, so retries and audit replay compare the same
  payload shape.
- Bundle replay is keyed by the same accepted caller + `idempotencyKey`; clients
  should reuse the same key only when retrying the same logical upload.
- Version conflict is evaluated on the accepted identity plus
  `manifest.version`.
- Matching consumes skill index records, not raw bundle uploads.
- Memory sync remains metadata-only at onboarding time; raw memory content stays
  in the agent control domain.

## Minimal API Example Matrix

| Scenario | HTTP | Contract signal |
| --- | --- | --- |
| Happy path bundle accepted | `201` | `result=CREATED`, `agentId`, `version`, synchronous `indexing` summary |
| Same payload replayed with the same idempotency key | `200` | `result=RETURNED_EXISTING` plus `replay.strategy=RETURN_EXISTING_ON_HASH_MATCH` |
| Signature signer or payload hash mismatch | `400` | `category=SIGNATURE`, stable signer/hash error code, `details.fieldPath` for the failing signature field |
| Schema invalid or unsupported version | `400` | `category=SCHEMA`, stable schema error code, `details.fieldPath` for the rejected bundle field |
| Existing version reused with a different payload hash | `409` | `category=VERSION`, `conflict.strategy=REJECT_ON_HASH_MISMATCH` with both payload hashes |

Canonical payload-hash steps:

1. Start from the submitted `bundle`.
2. Remove the entire `signature` object.
3. Serialize the remaining object with stable key ordering and preserved array
   order.
4. Compute SHA-256 and prefix the digest with `sha256:`.

Happy path request:

```json
{
  "idempotencyKey": "idem_agentbundle_001",
  "bundle": {
    "schemaVersion": "1.0",
    "manifest": {
      "name": "support_triage_agent",
      "version": "1.2.0",
      "runtime": "OPENCLAW",
      "entrypoint": "./bin/triage"
    },
    "identity": {
      "did": "did:key:z6MkhaXgBZDvotDkL9Q1Y1w2X5h2k2u6Y8VnSx4Q8Kestrel",
      "publicKey": "z6MkhaXgBZDvotDkL9Q1Y1w2X5h2k2u6Y8VnSx4Q8KestrelPubKey",
      "credentialLevel": "T1"
    },
    "skills": [
      {
        "skillId": "skill_support.triage",
        "version": "1.4.0",
        "inputSchema": { "type": "object" },
        "outputSchema": { "type": "object" }
      }
    ],
    "memoryRef": {
      "mode": "INDEX_ONLY",
      "summaryHash": "sha256:2222222222222222222222222222222222222222222222222222222222222222",
      "vectorIndexUri": "s3://agent-memory/support-triage/index.bin"
    },
    "signature": {
      "algorithm": "ED25519",
      "payloadHash": "sha256:3333333333333333333333333333333333333333333333333333333333333333",
      "signature": "base64:MEUCIQDdExampleSignatureForBundleUploadFlow1234567890==",
      "signerDid": "did:key:z6MkhaXgBZDvotDkL9Q1Y1w2X5h2k2u6Y8VnSx4Q8Kestrel"
    }
  }
}
```

Schema-invalid response:

```json
{
  "code": "AGENT_BUNDLE_SCHEMA_INVALID",
  "category": "SCHEMA",
  "message": "bundle.skills[0].outputSchema is required",
  "auditId": "audit_bundle_upload_schema_invalid",
  "retryable": false,
  "details": {
    "fieldPath": "bundle.skills[0].outputSchema",
    "rule": "required",
    "expected": "present",
    "actual": "missing"
  }
}
```

## Skill Index Contract

Each accepted upload creates one index record per skill:

| Field | Meaning |
| --- | --- |
| `skillId` | Stable capability identifier used by task hard filters |
| `version` | Uploaded skill version |
| `sourceAgentId` | Accepted agent identifier |
| `sourceVersion` | Accepted bundle version |
| `tags` | Optional search/filter hints copied from the bundle |

The upload response reports:

- `indexing.status`: `INDEXED` for MVP synchronous indexing
- `indexing.indexedSkillCount`: number of created skill index records
- `indexing.skills[]`: exact skill records published to matching
- `indexing.memoryMode`: uploaded memory synchronization mode for downstream
  policy checks

## Retry Guidance

| Outcome | HTTP | Retry guidance |
| --- | --- | --- |
| New bundle accepted | `201` | Safe to retry with the same `idempotencyKey` if the client is unsure whether the response was delivered. |
| Same payload replayed | `200` | Do not generate a new key; this is the stable replay path. |
| Signature/schema failure | `400` | Fix the payload first; do not blindly retry. |
| Version conflict | `409` | Do not retry unchanged payload; upload a new bundle version or reuse the stored artifact. |

## Backend Handoff

- Registry owns persistence for bundle metadata and version history.
- Matching owns skill index consumption but receives its source-of-truth records
  from onboarding.
- Audit must log the rejected or accepted outcome with a stable `auditId` for
  every terminal pipeline result.
