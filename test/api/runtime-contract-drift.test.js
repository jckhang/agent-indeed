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
  assert.equal(snapshot.runtimeRoutes.anchors["/v1/agents/bundles"], "src/api/openapi.yaml:59");
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
  assert.match(snapshot.shapes.proofPack.openapiAnchor, /^src\/api\/openapi\.yaml:\d+$/);
  assert.match(snapshot.shapes.proofPack.contractsAnchor, /^src\/api\/contracts\.ts:\d+$/);
  assert.equal(snapshot.shapes.proofPack.openapiHasProofSchemaVersion, true);
  assert.equal(snapshot.shapes.proofPack.openapiHasCapturedAt, true);
  assert.equal(snapshot.shapes.proofPack.contractsHasProofSchemaVersion, true);
  assert.equal(snapshot.shapes.proofPack.contractsHasCapturedAt, true);
  assert.match(
    snapshot.shapes.proofVerificationResponse.openapiAnchor,
    /^src\/api\/openapi\.yaml:\d+$/
  );
  assert.match(
    snapshot.shapes.proofVerificationResponse.contractsAnchor,
    /^src\/api\/contracts\.ts:\d+$/
  );
  assert.equal(snapshot.shapes.proofVerificationResponse.openapiHasDecisionTraceHash, true);
  assert.equal(snapshot.shapes.proofVerificationResponse.contractsHasDecisionTraceHash, true);
  assert.match(
    snapshot.shapes.proofVerifyErrorResponse.openapiAnchor,
    /^src\/api\/openapi\.yaml:\d+$/
  );
  assert.match(
    snapshot.shapes.proofVerifyErrorResponse.contractsAnchor,
    /^src\/api\/contracts\.ts:\d+$/
  );
  assert.equal(snapshot.shapes.proofVerifyErrorResponse.openapiHasDecisionTraceHash, true);
  assert.equal(snapshot.shapes.proofVerifyErrorResponse.contractsHasDecisionTraceHash, true);
});
