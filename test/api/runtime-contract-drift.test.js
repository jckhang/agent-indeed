import test from "node:test";
import assert from "node:assert/strict";

import {
  REQUIRED_RUNTIME_ROUTES,
  buildSnapshot,
  assertNoDrift
} from "../../scripts/check-runtime-contract-drift.js";

test("runtime contract drift guard keeps OpenAPI and contracts aligned", () => {
  const snapshot = buildSnapshot();

  assert.doesNotThrow(() => assertNoDrift(snapshot));
  assert.deepEqual(snapshot.runtimeRoutes.published, REQUIRED_RUNTIME_ROUTES);
  assert.deepEqual(
    snapshot.enums.proofVerificationReasonCode.openapi,
    snapshot.enums.proofVerificationReasonCode.contracts
  );
  assert.deepEqual(
    snapshot.enums.proofVerifyErrorCode.openapi,
    snapshot.enums.proofVerifyErrorCode.contracts
  );
});
