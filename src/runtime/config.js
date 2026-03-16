function readNonEmptyString(value, fallback, fieldName) {
  const resolved = value ?? fallback;
  if (typeof resolved !== "string" || resolved.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  return resolved.trim();
}

function readPort(value) {
  const parsed = Number.parseInt(value ?? "3000", 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return parsed;
}

export function loadRuntimeConfig(env = process.env) {
  return {
    host: readNonEmptyString(env.HOST, "127.0.0.1", "HOST"),
    port: readPort(env.PORT),
    serviceName: readNonEmptyString(
      env.SERVICE_NAME,
      "agent-indeed-control-plane",
      "SERVICE_NAME"
    )
  };
}
