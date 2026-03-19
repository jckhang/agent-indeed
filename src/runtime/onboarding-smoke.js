import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { createApp } from "./app.js";

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function buildBundlePayloadHash(bundle) {
  const { signature: _signature, ...unsignedBundle } = bundle;
  return sha256(stableSerialize(unsignedBundle));
}

function buildBundle() {
  const bundle = {
    schemaVersion: "1.0",
    manifest: {
      name: "support_triage_agent",
      version: "1.2.0",
      runtime: "OPENCLAW",
      entrypoint: "./bin/triage"
    },
    identity: {
      did: "did:key:z6MkhaXgBZDvotDkL9Q1Y1w2X5h2k2u6Y8VnSx4Q8Kestrel",
      publicKey: "z6MkhaXgBZDvotDkL9Q1Y1w2X5h2k2u6Y8VnSx4Q8KestrelPubKey",
      credentialLevel: "T1"
    },
    skills: [
      {
        skillId: "skill_support.triage",
        version: "1.4.0",
        tags: ["support", "routing"],
        inputSchema: { type: "object" },
        outputSchema: { type: "object" }
      }
    ],
    memoryRef: {
      mode: "INDEX_ONLY",
      summaryHash: "sha256:2222222222222222222222222222222222222222222222222222222222222222",
      vectorIndexUri: "s3://agent-memory/support-triage/index.bin"
    }
  };

  return {
    ...bundle,
    signature: {
      algorithm: "ED25519",
      payloadHash: buildBundlePayloadHash(bundle),
      signature: "base64:MEUCIQDdExampleSignatureForBundleUploadFlow1234567890==",
      signerDid: bundle.identity.did,
      signedAt: "2026-03-19T01:30:00Z"
    }
  };
}

async function expectJson(response, expectedStatus) {
  assert.equal(response.status, expectedStatus);
  return response.json();
}

export async function runOnboardingSmoke({
  host = "127.0.0.1",
  serviceName = "agent-indeed-onboarding-smoke",
  log = (message) => console.log(message)
} = {}) {
  const app = createApp({
    config: { serviceName },
    logger: () => {}
  });
  const server = createServer(app);

  try {
    server.listen(0, host);
    await once(server, "listening");

    const address = server.address();
    const baseUrl = `http://${host}:${address.port}`;
    const bundle = buildBundle();
    const request = {
      idempotencyKey: "idem_agentbundle_001",
      bundle
    };

    log(`onboarding smoke listening on ${baseUrl}`);

    const created = await expectJson(
      await fetch(`${baseUrl}/v1/agents/bundles`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(request)
      }),
      201
    );
    assert.equal(created.result, "CREATED");
    assert.equal(created.agentId, "agent_support_triage_agent");
    assert.equal(created.indexing.indexedSkillCount, 1);
    log(`PASS POST /v1/agents/bundles -> ${created.agentId}@${created.version}`);

    const replay = await expectJson(
      await fetch(`${baseUrl}/v1/agents/bundles`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(request)
      }),
      200
    );
    assert.equal(replay.result, "RETURNED_EXISTING");
    assert.equal(replay.replay.strategy, "RETURN_EXISTING_ON_HASH_MATCH");
    log(`PASS replay /v1/agents/bundles -> ${replay.replay.strategy}`);

    const mismatchedHash = {
      idempotencyKey: "idem_agentbundle_bad_hash",
      bundle: {
        ...bundle,
        signature: {
          ...bundle.signature,
          payloadHash: "sha256:badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbad"
        }
      }
    };
    const mismatch = await expectJson(
      await fetch(`${baseUrl}/v1/agents/bundles`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(mismatchedHash)
      }),
      400
    );
    assert.equal(mismatch.code, "AGENT_BUNDLE_SIGNATURE_PAYLOAD_MISMATCH");
    log(`PASS payload hash mismatch -> ${mismatch.code}`);

    return {
      serviceName,
      baseUrl,
      agentId: created.agentId,
      version: created.version,
      replayStrategy: replay.replay.strategy,
      mismatchCode: mismatch.code
    };
  } finally {
    server.close();
    await once(server, "close");
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  runOnboardingSmoke()
    .then((result) => {
      console.log(JSON.stringify({ status: "ok", ...result }, null, 2));
    })
    .catch((error) => {
      console.error("onboarding smoke failed");
      console.error(error);
      process.exitCode = 1;
    });
}
