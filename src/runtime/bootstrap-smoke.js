import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createApp } from "./app.js";

function buildBootstrapTask() {
  return {
    title: "Bootstrap runtime smoke",
    description: "Verify the local control-plane bootstrap path end-to-end",
    budget: {
      currency: "USD",
      minAmount: 100,
      maxAmount: 250
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
      valueScore: 0.2
    },
    powmPolicy: {
      mode: "AUTO_TIERED",
      baseDifficulty: 2
    },
    biddingWindow: {
      commitDeadline: "2026-03-19T00:00:00Z",
      revealDeadline: "2026-03-20T00:00:00Z"
    }
  };
}

async function expectJson(response, expectedStatus) {
  assert.equal(response.status, expectedStatus);
  return response.json();
}

export async function runBootstrapSmoke({
  host = "127.0.0.1",
  serviceName = "agent-indeed-control-plane-smoke",
  log = (message) => console.log(message)
} = {}) {
  const app = createApp({
    config: { serviceName },
    logger: () => {}
  });
  const server = createServer(app);

  let listening = false;

  try {
    server.listen(0, host);
    await once(server, "listening");
    listening = true;

    const address = server.address();
    const baseUrl = `http://${host}:${address.port}`;

    log(`bootstrap smoke listening on ${baseUrl}`);

    const health = await expectJson(await fetch(`${baseUrl}/healthz`), 200);
    log(`PASS /healthz -> ${health.status}`);

    const readiness = await expectJson(await fetch(`${baseUrl}/readyz`), 200);
    assert.equal(readiness.status, "ready");
    log(`PASS /readyz -> ${readiness.status}`);

    const initialSummary = await expectJson(
      await fetch(`${baseUrl}/v1/runtime/summary`),
      200
    );
    assert.equal(initialSummary.storage.tasks, 0);
    log(`PASS /v1/runtime/summary -> tasks=${initialSummary.storage.tasks}`);

    const created = await expectJson(
      await fetch(`${baseUrl}/v1/tasks`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-workspace-id": "workspace-kestrel"
        },
        body: JSON.stringify({
          task: buildBootstrapTask()
        })
      }),
      201
    );
    assert.match(created.taskId, /^task_/);
    log(`PASS POST /v1/tasks -> ${created.taskId}`);

    const task = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}`),
      200
    );
    assert.equal(task.task.title, "Bootstrap runtime smoke");
    log(`PASS GET /v1/tasks/${created.taskId}`);

    const auditEvents = await expectJson(
      await fetch(`${baseUrl}/v1/tasks/${created.taskId}/audit-events`),
      200
    );
    assert.equal(auditEvents.count, 1);
    assert.equal(auditEvents.events[0].eventType, "TASK_CREATED");
    log(`PASS GET /v1/tasks/${created.taskId}/audit-events -> ${auditEvents.count} event`);

    const summary = await expectJson(await fetch(`${baseUrl}/v1/runtime/summary`), 200);
    assert.equal(summary.storage.tasks, 1);
    assert.equal(summary.storage.auditEvents, 1);
    log(
      `PASS final summary -> tasks=${summary.storage.tasks}, auditEvents=${summary.storage.auditEvents}`
    );

    return {
      serviceName,
      baseUrl,
      taskId: created.taskId,
      auditEventCount: auditEvents.count,
      storage: summary.storage
    };
  } finally {
    if (listening) {
      server.close();
      await once(server, "close");
    }
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  runBootstrapSmoke()
    .then((result) => {
      console.log(JSON.stringify({ status: "ok", ...result }, null, 2));
    })
    .catch((error) => {
      console.error("bootstrap smoke failed");
      console.error(error);
      process.exitCode = 1;
    });
}
