#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const openapiPath = path.join(repoRoot, "src/api/openapi.yaml");
const contractsPath = path.join(repoRoot, "src/api/contracts.ts");

const REQUIRED_RUNTIME_ROUTES = [
  "/healthz",
  "/readyz",
  "/v1/runtime/summary",
  "/v1/tasks/{taskId}",
  "/v1/tasks/{taskId}/audit-events",
  "/v1/tasks/{taskId}/candidates",
  "/v1/tasks/{taskId}/award",
  "/v1/tasks/{taskId}/bids/commit",
  "/v1/tasks/{taskId}/bids/{bidId}",
  "/v1/tasks/{taskId}/bids/reveal",
  "/v1/tasks/{taskId}/proof-policy",
  "/v1/tasks/{taskId}/proofs/{proofId}",
  "/v1/tasks/{taskId}/proofs/verify"
];

function unique(values) {
  return [...new Set(values)];
}

function extractTsStringUnion(source, typeName) {
  const match = source.match(new RegExp(`export type ${typeName} =([\\s\\S]*?);`));
  if (!match) {
    throw new Error(`Unable to find TypeScript type union for ${typeName}`);
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

function extractOpenApiEnum(source, schemaName) {
  const block = source.match(
    new RegExp(`^\\s{4}${schemaName}:\\n([\\s\\S]*?)(?=^\\s{4}[A-Za-z0-9_]+:|\\Z)`, "m")
  );

  if (!block) {
    throw new Error(`Unable to find OpenAPI schema block for ${schemaName}`);
  }

  return [...block[1].matchAll(/^ {8}- (.+)$/gm)].map((entry) => entry[1]);
}

function extractOpenApiPaths(source) {
  return unique([...source.matchAll(/^  (\/[^\s:]+):$/gm)].map((entry) => entry[1])).sort();
}

function buildSnapshot() {
  const openapiSource = readFileSync(openapiPath, "utf8");
  const contractsSource = readFileSync(contractsPath, "utf8");
  const openapiPaths = extractOpenApiPaths(openapiSource);

  return {
    generatedFrom: {
      openapiPath: "src/api/openapi.yaml",
      contractsPath: "src/api/contracts.ts"
    },
    runtimeRoutes: {
      published: REQUIRED_RUNTIME_ROUTES.filter((route) => openapiPaths.includes(route)),
      missingRequired: REQUIRED_RUNTIME_ROUTES.filter((route) => !openapiPaths.includes(route))
    },
    enums: {
      proofVerificationReasonCode: {
        openapi: extractOpenApiEnum(openapiSource, "ProofVerificationReasonCode"),
        contracts: extractTsStringUnion(contractsSource, "ProofVerificationReasonCode")
      },
      proofVerifyErrorCode: {
        openapi: extractOpenApiEnum(openapiSource, "ProofVerifyErrorCode"),
        contracts: extractTsStringUnion(contractsSource, "ProofVerifyErrorCode")
      }
    }
  };
}

function sameEntries(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertNoDrift(snapshot) {
  const failures = [];

  if (snapshot.runtimeRoutes.missingRequired.length > 0) {
    failures.push(
      `Missing required runtime routes in OpenAPI: ${snapshot.runtimeRoutes.missingRequired.join(", ")}`
    );
  }

  for (const [enumName, enumSnapshot] of Object.entries(snapshot.enums)) {
    if (!sameEntries(enumSnapshot.openapi, enumSnapshot.contracts)) {
      failures.push(
        `${enumName} differs between OpenAPI and TypeScript contracts.\n` +
          `OpenAPI: ${enumSnapshot.openapi.join(", ")}\n` +
          `Contracts: ${enumSnapshot.contracts.join(", ")}`
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n\n"));
  }
}

export {
  REQUIRED_RUNTIME_ROUTES,
  buildSnapshot,
  assertNoDrift
};

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const snapshot = buildSnapshot();

  if (process.argv.includes("--assert")) {
    assertNoDrift(snapshot);
  }

  console.log(JSON.stringify(snapshot, null, 2));
}
