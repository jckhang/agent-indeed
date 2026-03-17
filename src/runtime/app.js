import { readJson, sendJson, sendNotFound } from "./lib/http.js";
import { InMemoryControlPlaneStore } from "./store/in-memory-control-plane-store.js";

function buildTaskValidationError(message, details = {}) {
  return {
    statusCode: 400,
    body: {
      code: "TASK_SPEC_CONSTRAINTS_MISSING",
      category: "VALIDATION",
      message,
      auditId: "audit_task_spec_invalid",
      retryable: false,
      details
    }
  };
}

function validateTaskSpec(task) {
  if (!task || typeof task !== "object") {
    return buildTaskValidationError("task payload is required", { field: "task" });
  }

  const requiredObjects = [
    "budget",
    "sla",
    "constraints",
    "risk",
    "powmPolicy",
    "biddingWindow"
  ];

  if (!task.title || !task.description) {
    return buildTaskValidationError("task.title and task.description are required", {
      fields: ["task.title", "task.description"]
    });
  }

  for (const field of requiredObjects) {
    if (!task[field] || typeof task[field] !== "object") {
      return buildTaskValidationError(`${field} is required`, { field: `task.${field}` });
    }
  }

  if (!task.constraints.identityTierMin) {
    return buildTaskValidationError("constraints.identityTierMin is required", {
      field: "task.constraints.identityTierMin"
    });
  }

  if (!Array.isArray(task.constraints.requiredSkills)) {
    return buildTaskValidationError("constraints.requiredSkills must be an array", {
      field: "task.constraints.requiredSkills"
    });
  }

  if (!task.biddingWindow.commitDeadline || !task.biddingWindow.revealDeadline) {
    return buildTaskValidationError("biddingWindow deadlines are required", {
      fields: [
        "task.biddingWindow.commitDeadline",
        "task.biddingWindow.revealDeadline"
      ]
    });
  }

  return null;
}

function buildTaskDetailResponse(record) {
  return {
    taskId: record.taskId,
    workspaceId: record.workspaceId,
    status: record.status,
    createdAt: record.createdAt,
    commitDeadline: record.commitDeadline,
    revealDeadline: record.revealDeadline,
    task: record.task
  };
}

function buildTaskAuditEventListResponse(taskId, events) {
  return {
    taskId,
    count: events.length,
    events
  };
}

function logRequest({
  logger,
  config,
  method,
  pathname,
  statusCode,
  durationMs,
  workspaceId
}) {
  logger({
    service: config.serviceName,
    method,
    path: pathname,
    statusCode,
    durationMs,
    workspaceId
  });
}

export function createApp({
  config,
  store = new InMemoryControlPlaneStore(),
  now = () => new Date().toISOString(),
  startedAt = Date.now(),
  logger = (entry) => console.log(JSON.stringify(entry))
} = {}) {
  return async function app(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host ?? "127.0.0.1"}`);
    const requestStartedAt = Date.now();
    const workspaceId = req.headers["x-workspace-id"] ?? null;

    function reply(statusCode, payload) {
      logRequest({
        logger,
        config,
        method: req.method,
        pathname: requestUrl.pathname,
        statusCode,
        durationMs: Date.now() - requestStartedAt,
        workspaceId
      });
      return sendJson(res, statusCode, payload);
    }

    if (req.method === "GET" && requestUrl.pathname === "/healthz") {
      return reply(200, {
        status: "ok",
        service: config.serviceName,
        now: now(),
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
      });
    }

    if (req.method === "GET" && requestUrl.pathname === "/readyz") {
      return reply(200, {
        status: "ready",
        service: config.serviceName,
        checks: [
          { name: "config", status: "ok" },
          { name: "storage", status: "ok" }
        ],
        storage: store.summary()
      });
    }

    if (req.method === "GET" && requestUrl.pathname === "/v1/runtime/summary") {
      return reply(200, {
        service: config.serviceName,
        generatedAt: now(),
        storage: store.summary()
      });
    }

    if (req.method === "POST" && requestUrl.pathname === "/v1/tasks") {
      if (!workspaceId) {
        return reply(400, {
          code: "TASK_SPEC_CONSTRAINTS_MISSING",
          category: "VALIDATION",
          message: "X-Workspace-Id header is required",
          auditId: "audit_task_workspace_missing",
          retryable: false,
          details: { header: "X-Workspace-Id" }
        });
      }

      let payload;
      try {
        payload = await readJson(req);
      } catch {
        return reply(400, {
          code: "TASK_SPEC_CONSTRAINTS_MISSING",
          category: "VALIDATION",
          message: "Request body must be valid JSON",
          auditId: "audit_task_body_invalid_json",
          retryable: false
        });
      }

      const validationError = validateTaskSpec(payload?.task);
      if (validationError) {
        return reply(validationError.statusCode, validationError.body);
      }

      const { record } = store.createTask({
        workspaceId,
        task: payload.task
      });

      return reply(201, {
        taskId: record.taskId,
        status: record.status,
        commitDeadline: record.commitDeadline,
        revealDeadline: record.revealDeadline
      });
    }

    const taskDetailMatch = requestUrl.pathname.match(/^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})$/);
    if (req.method === "GET" && taskDetailMatch) {
      const record = store.getTask(taskDetailMatch[1]);
      if (!record) {
        return reply(404, {
          code: "AUDIT_QUERY_NOT_FOUND",
          category: "AUDIT",
          message: `Task ${taskDetailMatch[1]} was not found`,
          auditId: "audit_task_not_found",
          retryable: false
        });
      }

      return reply(200, buildTaskDetailResponse(record));
    }

    const taskAuditEventsMatch = requestUrl.pathname.match(
      /^\/v1\/tasks\/(task_[a-zA-Z0-9_-]{8,64})\/audit-events$/
    );
    if (req.method === "GET" && taskAuditEventsMatch) {
      const taskId = taskAuditEventsMatch[1];
      const record = store.getTask(taskId);
      if (!record) {
        return reply(404, {
          code: "AUDIT_QUERY_NOT_FOUND",
          category: "AUDIT",
          message: `Task ${taskId} was not found`,
          auditId: "audit_task_not_found",
          retryable: false
        });
      }

      return reply(
        200,
        buildTaskAuditEventListResponse(taskId, store.listAuditEventsForTask(taskId))
      );
    }

    logRequest({
      logger,
      config,
      method: req.method,
      pathname: requestUrl.pathname,
      statusCode: 404,
      durationMs: Date.now() - requestStartedAt,
      workspaceId
    });
    return sendNotFound(res, requestUrl.pathname);
  };
}
