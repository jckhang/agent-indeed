import test from "node:test";
import assert from "node:assert/strict";
import { loadRuntimeConfig } from "../../src/runtime/config.js";

test("loadRuntimeConfig applies defaults for local runtime bootstrap", () => {
  const config = loadRuntimeConfig({});

  assert.deepEqual(config, {
    host: "127.0.0.1",
    port: 3000,
    serviceName: "agent-indeed-control-plane"
  });
});

test("loadRuntimeConfig rejects invalid ports", () => {
  assert.throws(
    () => loadRuntimeConfig({ PORT: "0" }),
    /PORT must be an integer between 1 and 65535/
  );
  assert.throws(
    () => loadRuntimeConfig({ PORT: "70000" }),
    /PORT must be an integer between 1 and 65535/
  );
});

test("loadRuntimeConfig rejects blank host and service names", () => {
  assert.throws(() => loadRuntimeConfig({ HOST: "   " }), /HOST must be a non-empty string/);
  assert.throws(
    () => loadRuntimeConfig({ SERVICE_NAME: "" }),
    /SERVICE_NAME must be a non-empty string/
  );
});
