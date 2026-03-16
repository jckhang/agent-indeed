const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8"
};

export async function readJson(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf8").trim();
  if (!body) {
    return null;
  }

  return JSON.parse(body);
}

export function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, JSON_HEADERS);
  res.end(JSON.stringify(payload, null, 2));
}

export function sendNotFound(res, requestPath) {
  sendJson(res, 404, {
    code: "AUDIT_QUERY_NOT_FOUND",
    category: "AUDIT",
    message: `No route is registered for ${requestPath}`,
    auditId: "audit_route_not_found",
    retryable: false
  });
}
