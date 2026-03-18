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
  assert.deepEqual(Object.keys(snapshot.runtimeRoutes.anchors), REQUIRED_RUNTIME_ROUTES);
  assert.match(
    snapshot.enums.proofVerificationReasonCode.openapiAnchor,
    /^src\/api\/openapi\.yaml:\d+$/
  );
  assert.match(
    snapshot.enums.proofVerificationReasonCode.contractsAnchor,
    /^src\/api\/contracts\.ts:\d+$/
  );
  assert.match(snapshot.enums.proofVerifyErrorCode.openapiAnchor, /^src\/api\/openapi\.yaml:\d+$/);
  assert.match(
    snapshot.enums.proofVerifyErrorCode.contractsAnchor,
    /^src\/api\/contracts\.ts:\d+$/
  );
  assert.deepEqual(
    snapshot.enums.proofVerificationReasonCode.openapi,
    snapshot.enums.proofVerificationReasonCode.contracts
  );
  assert.deepEqual(
    snapshot.enums.proofVerifyErrorCode.openapi,
    snapshot.enums.proofVerifyErrorCode.contracts
  );
});
