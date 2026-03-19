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
    new RegExp(`^ {4}${schemaName}:\\n([\\s\\S]*?)(?=^ {4}[A-Za-z0-9_]+:|\\Z)`, "m")
  );

  if (!block) {
    throw new Error(`Unable to find OpenAPI schema block for ${schemaName}`);
  }

  return [...block[1].matchAll(/^ {8}- (.+)$/gm)].map((entry) => entry[1]);
}

function extractTsTypeAnchor(source, typeName) {
  const match = source.match(new RegExp(`^export type ${typeName} =`, "m"));
  if (!match || match.index === undefined) {
    throw new Error(`Unable to find TypeScript type anchor for ${typeName}`);
  }

  const lineNumber = source.slice(0, match.index).split("\n").length;
  return `src/api/contracts.ts:${lineNumber}`;
}

function extractOpenApiSchemaAnchor(source, schemaName) {
  const match = source.match(new RegExp(`^ {4}${schemaName}:$`, "m"));
  if (!match || match.index === undefined) {
    throw new Error(`Unable to find OpenAPI schema anchor for ${schemaName}`);
  }

  const lineNumber = source.slice(0, match.index).split("\n").length;
  return `src/api/openapi.yaml:${lineNumber}`;
}

function extractOpenApiSchemaBlock(source, schemaName) {
  const block = source.match(
    new RegExp(`^ {4}${schemaName}:\\n([\\s\\S]*?)(?=^ {4}[A-Za-z0-9_]+:|\\Z)`, "m")
  );

  if (!block) {
    throw new Error(`Unable to find OpenAPI schema block for ${schemaName}`);
  }

  return block[1];
}

function extractTsInterfaceAnchor(source, interfaceName) {
  const match = source.match(new RegExp(`^export interface ${interfaceName}\\b`, "m"));
  if (!match || match.index === undefined) {
    throw new Error(`Unable to find TypeScript interface anchor for ${interfaceName}`);
  }

  const lineNumber = source.slice(0, match.index).split("\n").length;
  return `src/api/contracts.ts:${lineNumber}`;
}

function hasMatch(source, pattern, description) {
  if (!pattern.test(source)) {
    throw new Error(`Unable to find ${description}`);
  }

  return true;
}

function extractOpenApiPaths(source) {
  return unique([...source.matchAll(/^  (\/[^\s:]+):$/gm)].map((entry) => entry[1])).sort();
}

function extractOpenApiPathAnchors(source) {
  return new Map(
    [...source.matchAll(/^  (\/[^\s:]+):$/gm)].map((entry) => {
      const lineNumber = source.slice(0, entry.index).split("\n").length;
      return [entry[1], `src/api/openapi.yaml:${lineNumber}`];
    })
  );
}

function buildSnapshot() {
  const openapiSource = readFileSync(openapiPath, "utf8");
  const contractsSource = readFileSync(contractsPath, "utf8");
  const openapiPaths = extractOpenApiPaths(openapiSource);
  const openapiPathAnchors = extractOpenApiPathAnchors(openapiSource);
  const publishedRoutes = REQUIRED_RUNTIME_ROUTES.filter((route) => openapiPaths.includes(route));
  return {
    generatedFrom: {
      openapiPath: "src/api/openapi.yaml",
      contractsPath: "src/api/contracts.ts"
    },
    runtimeRoutes: {
      published: publishedRoutes,
      anchors: Object.fromEntries(
        publishedRoutes.map((route) => [route, openapiPathAnchors.get(route)])
      ),
      missingRequired: REQUIRED_RUNTIME_ROUTES.filter((route) => !openapiPaths.includes(route))
    },
    enums: {
      proofVerificationReasonCode: {
        openapiAnchor: extractOpenApiSchemaAnchor(openapiSource, "ProofVerificationReasonCode"),
        contractsAnchor: extractTsTypeAnchor(contractsSource, "ProofVerificationReasonCode"),
        openapi: extractOpenApiEnum(openapiSource, "ProofVerificationReasonCode"),
        contracts: extractTsStringUnion(contractsSource, "ProofVerificationReasonCode")
      },
      proofVerifyErrorCode: {
        openapiAnchor: extractOpenApiSchemaAnchor(openapiSource, "ProofVerifyErrorCode"),
        contractsAnchor: extractTsTypeAnchor(contractsSource, "ProofVerifyErrorCode"),
        openapi: extractOpenApiEnum(openapiSource, "ProofVerifyErrorCode"),
        contracts: extractTsStringUnion(contractsSource, "ProofVerifyErrorCode")
      }
    },
    shapes: {
      proofPack: {
        openapiAnchor: extractOpenApiSchemaAnchor(openapiSource, "ProofPack"),
        contractsAnchor: extractTsInterfaceAnchor(contractsSource, "ProofPack"),
        openapiHasProofSchemaVersion: hasMatch(
          openapiSource,
          /ProofPack:[\s\S]*?proofSchemaVersion:/,
          "ProofPack.proofSchemaVersion in OpenAPI"
        ),
        openapiHasCapturedAt: hasMatch(
          openapiSource,
          /ProofPack:[\s\S]*?capturedAt:/,
          "ProofPack.capturedAt in OpenAPI"
        ),
        contractsHasProofSchemaVersion: hasMatch(
          contractsSource,
          /export interface ProofPack[\s\S]*?proofSchemaVersion: ProofSchemaVersion;/,
          "ProofPack.proofSchemaVersion in TypeScript contracts"
        ),
        contractsHasCapturedAt: hasMatch(
          contractsSource,
          /export interface ProofPack[\s\S]*?capturedAt: string;/,
          "ProofPack.capturedAt in TypeScript contracts"
        )
      },
      proofVerificationResponse: {
        openapiAnchor: extractOpenApiSchemaAnchor(openapiSource, "ProofVerificationResponse"),
        contractsAnchor: extractTsInterfaceAnchor(contractsSource, "ProofVerificationResponse"),
        openapiHasDecisionTraceHash: hasMatch(
          openapiSource,
          /ProofVerificationResponse:[\s\S]*?decisionTraceHash:/,
          "ProofVerificationResponse.decisionTraceHash in OpenAPI"
        ),
        contractsHasDecisionTraceHash: hasMatch(
          contractsSource,
          /export interface ProofVerificationResponse[\s\S]*?decisionTraceHash\?: string;/,
          "ProofVerificationResponse.decisionTraceHash in TypeScript contracts"
        )
      },
      proofVerifyErrorResponse: {
        openapiAnchor: extractOpenApiSchemaAnchor(openapiSource, "ProofVerifyErrorResponse"),
        contractsAnchor: extractTsInterfaceAnchor(contractsSource, "ProofVerifyErrorResponse"),
        openapiHasDecisionTraceHash: hasMatch(
          openapiSource,
          /ProofVerifyErrorResponse:[\s\S]*?decisionTraceHash:/,
          "ProofVerifyErrorResponse.details.decisionTraceHash in OpenAPI"
        ),
        contractsHasDecisionTraceHash: hasMatch(
          contractsSource,
          /export interface ProofVerifyErrorResponse[\s\S]*?details\?: \{[\s\S]*?decisionTraceHash\?: string;/,
          "ProofVerifyErrorResponse.details.decisionTraceHash in TypeScript contracts"
        )
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

  for (const [shapeName, shapeSnapshot] of Object.entries(snapshot.shapes)) {
    for (const [fieldName, present] of Object.entries(shapeSnapshot)) {
      if (fieldName.endsWith("Anchor")) {
        continue;
      }

      if (!present) {
        failures.push(`${shapeName}.${fieldName} is missing from the published contract snapshot.`);
      }
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
