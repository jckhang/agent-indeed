import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createApp } from "../../src/runtime/app.js";

async function startTestServer() {
  const logEntries = [];
  const app = createApp({
    config: {
      serviceName: "test-control-plane"
    },
    now: () => "2026-03-16T00:00:00.000Z",
    startedAt: Date.now(),
    logger: (entry) => {
      logEntries.push(entry);
    }
  });
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return { server, baseUrl, logEntries };
}

test("healthz and readyz return runtime status", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const healthResponse = await fetch(`${baseUrl}/healthz`);
    assert.equal(healthResponse.status, 200);
    const healthBody = await healthResponse.json();
    assert.equal(healthBody.status, "ok");
    assert.equal(healthBody.service, "test-control-plane");

    const readyResponse = await fetch(`${baseUrl}/readyz`);
    assert.equal(readyResponse.status, 200);
    const readyBody = await readyResponse.json();
    assert.equal(readyBody.status, "ready");
    assert.equal(readyBody.storage.tasks, 0);
    assert.deepEqual(
      logEntries.map((entry) => ({
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode
      })),
      [
        { method: "GET", path: "/healthz", statusCode: 200 },
        { method: "GET", path: "/readyz", statusCode: 200 }
      ]
    );
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("POST /v1/tasks persists a task and updates runtime summary", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const createResponse = await fetch(`${baseUrl}/v1/tasks`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-workspace-id": "workspace-kestrel"
      },
      body: JSON.stringify({
        task: {
          title: "Run dispatch loop baseline",
          description: "Bootstrap the first runnable backend route",
          budget: {
            currency: "USD",
            minAmount: 100,
            maxAmount: 300
          },
          sla: {
            deadlineAt: "2026-03-20T00:00:00Z",
            maxLatencyMs: 5000
          },
          constraints: {
            identityTierMin: "T1",
            requiredSkills: ["backend", "api"]
          },
          risk: {
            level: "LOW",
            valueScore: 20
          },
          powmPolicy: {
            mode: "AUTO_TIERED",
            baseDifficulty: 2
          },
          biddingWindow: {
            commitDeadline: "2026-03-19T00:00:00Z",
            revealDeadline: "2026-03-20T00:00:00Z"
          }
        }
      })
    });

    assert.equal(createResponse.status, 201);
    const createBody = await createResponse.json();
    assert.equal(createBody.taskId, "task_00000001");
    assert.equal(createBody.status, "OPEN_FOR_MATCHING");

    const summaryResponse = await fetch(`${baseUrl}/v1/runtime/summary`);
    assert.equal(summaryResponse.status, 200);
    const summaryBody = await summaryResponse.json();
    assert.equal(summaryBody.storage.tasks, 1);
    assert.equal(summaryBody.storage.auditEvents, 1);
    assert.equal(summaryBody.storage.latestTaskId, "task_00000001");
    assert.equal(logEntries[0].workspaceId, "workspace-kestrel");
    assert.equal(logEntries[0].statusCode, 201);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("POST /v1/tasks rejects requests without a workspace header", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/v1/tasks`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        task: {
          title: "Missing workspace",
          description: "Exercise validation for required headers",
          budget: {
            currency: "USD",
            minAmount: 10,
            maxAmount: 20
          },
          sla: {
            deadlineAt: "2026-03-20T00:00:00Z",
            maxLatencyMs: 1000
          },
          constraints: {
            identityTierMin: "T1",
            requiredSkills: []
          },
          risk: {
            level: "LOW",
            valueScore: 1
          },
          powmPolicy: {
            mode: "AUTO_TIERED",
            baseDifficulty: 1
          },
          biddingWindow: {
            commitDeadline: "2026-03-19T00:00:00Z",
            revealDeadline: "2026-03-20T00:00:00Z"
          }
        }
      })
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.code, "TASK_SPEC_CONSTRAINTS_MISSING");
    assert.equal(body.details.header, "X-Workspace-Id");
    assert.equal(logEntries.at(-1)?.statusCode, 400);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("GET /v1/tasks/:taskId returns the persisted task payload", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const createResponse = await fetch(`${baseUrl}/v1/tasks`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-workspace-id": "workspace-kestrel"
      },
      body: JSON.stringify({
        task: {
          title: "Inspect a stored task",
          description: "Read back the runtime bootstrap record",
          budget: {
            currency: "USD",
            minAmount: 50,
            maxAmount: 75
          },
          sla: {
            deadlineAt: "2026-03-20T00:00:00Z",
            maxLatencyMs: 2500
          },
          constraints: {
            identityTierMin: "T1",
            requiredSkills: ["backend"]
          },
          risk: {
            level: "LOW",
            valueScore: 10
          },
          powmPolicy: {
            mode: "AUTO_TIERED",
            baseDifficulty: 1
          },
          biddingWindow: {
            commitDeadline: "2026-03-19T00:00:00Z",
            revealDeadline: "2026-03-20T00:00:00Z"
          }
        }
      })
    });
    const createBody = await createResponse.json();

    const detailResponse = await fetch(`${baseUrl}/v1/tasks/${createBody.taskId}`);
    assert.equal(detailResponse.status, 200);
    const detailBody = await detailResponse.json();
    assert.equal(detailBody.taskId, createBody.taskId);
    assert.equal(detailBody.workspaceId, "workspace-kestrel");
    assert.equal(detailBody.task.title, "Inspect a stored task");
    assert.equal(logEntries.at(-1)?.path, `/v1/tasks/${createBody.taskId}`);
    assert.equal(logEntries.at(-1)?.statusCode, 200);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("GET /v1/tasks/:taskId returns 404 for unknown ids", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/v1/tasks/task_99999999`);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.code, "AUDIT_QUERY_NOT_FOUND");
    assert.equal(logEntries.at(-1)?.path, "/v1/tasks/task_99999999");
    assert.equal(logEntries.at(-1)?.statusCode, 404);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("GET /v1/tasks/:taskId/audit-events returns the runtime audit trail", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const createResponse = await fetch(`${baseUrl}/v1/tasks`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-workspace-id": "workspace-kestrel"
      },
      body: JSON.stringify({
        task: {
          title: "Inspect audit trail",
          description: "Read back the bootstrap audit timeline",
          budget: {
            currency: "USD",
            minAmount: 60,
            maxAmount: 90
          },
          sla: {
            deadlineAt: "2026-03-20T00:00:00Z",
            maxLatencyMs: 2500
          },
          constraints: {
            identityTierMin: "T1",
            requiredSkills: ["backend"]
          },
          risk: {
            level: "LOW",
            valueScore: 10
          },
          powmPolicy: {
            mode: "AUTO_TIERED",
            baseDifficulty: 1
          },
          biddingWindow: {
            commitDeadline: "2026-03-19T00:00:00Z",
            revealDeadline: "2026-03-20T00:00:00Z"
          }
        }
      })
    });
    const createBody = await createResponse.json();

    const auditResponse = await fetch(
      `${baseUrl}/v1/tasks/${createBody.taskId}/audit-events`
    );
    assert.equal(auditResponse.status, 200);
    const auditBody = await auditResponse.json();
    assert.equal(auditBody.taskId, createBody.taskId);
    assert.equal(auditBody.count, 1);
    assert.equal(auditBody.events[0].entityType, "task");
    assert.equal(auditBody.events[0].taskId, createBody.taskId);
    assert.equal(logEntries.at(-1)?.path, `/v1/tasks/${createBody.taskId}/audit-events`);
    assert.equal(logEntries.at(-1)?.statusCode, 200);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("unknown routes are logged as 404s", async () => {
  const { server, baseUrl, logEntries } = await startTestServer();

  try {
    const response = await fetch(`${baseUrl}/does-not-exist`);
    assert.equal(response.status, 404);
    assert.equal(logEntries.at(-1)?.path, "/does-not-exist");
    assert.equal(logEntries.at(-1)?.statusCode, 404);
  } finally {
    server.close();
    await once(server, "close");
  }
});
