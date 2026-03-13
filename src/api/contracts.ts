export type IdentityTier = "T0" | "T1" | "T2";

export interface AgentBundle {
  manifest: {
    name: string;
    version: string;
    runtime: "OPENCLAW" | "CUSTOM_CONTAINER" | "WASM";
    entrypoint: string;
    image?: string;
    checksum?: string;
  };
  identity: {
    did: string;
    publicKey: string;
    credentialLevel: IdentityTier;
    issuer?: string;
    trustScore?: number;
    attestations?: Array<{
      type: string;
      value: string;
    }>;
  };
  skills: Array<{
    skillId: string;
    version: string;
    tags?: string[];
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
  }>;
  memoryRef: {
    mode: "INDEX_ONLY" | "ENCRYPTED_REF" | "FULL";
    summaryHash: string;
    vectorIndexUri?: string;
    encryptedBlobUri?: string;
    accessPolicy?: {
      scope: "DISCOVERY_ONLY" | "MATCHING_ONLY" | "TASK_RUNTIME";
      ttlSeconds: number;
    };
  };
  signature: {
    algorithm: "ED25519" | "SECP256K1";
    payloadHash: string;
    signature: string;
    signerDid: string;
    signedAt?: string;
  };
}

export interface TaskSpec {
  title: string;
  description: string;
  budget: {
    currency: string;
    minAmount: number;
    maxAmount: number;
    settlementModel?: "FIXED" | "MILESTONE" | "TIME_AND_MATERIAL";
  };
  sla: {
    deadlineAt: string;
    maxLatencyMs: number;
    minSuccessRate?: number;
  };
  constraints: {
    identityTierMin: IdentityTier;
    requiredSkills: string[];
    preferredSkills?: string[];
    complianceTags?: string[];
  };
  risk: {
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    valueScore: number;
    abuseSensitivity?: "LOW" | "MEDIUM" | "HIGH";
  };
  powmPolicy: {
    mode: "AUTO_TIERED" | "MANUAL";
    baseDifficulty: number;
    challengeType?: "SAMPLE_EXECUTION" | "HASHCASH" | "STAKE" | "HYBRID";
    stakeMinAmount?: number;
  };
  biddingWindow: {
    commitDeadline: string;
    revealDeadline: string;
  };
}

export interface ProofPack {
  proofId: string;
  taskId: string;
  agentId: string;
  identityProof: {
    credentialLevel: IdentityTier;
    signerDid: string;
    signature: string;
    attestationRefs?: string[];
  };
  sampleWork: {
    sampleTaskDigest: string;
    outputDigest: string;
    qualityScore?: number;
    runtimeMs?: number;
  };
  executionTrace: {
    traceHash: string;
    traceUri: string;
    traceSignature: string;
    toolCallCount?: number;
  };
  antiSybil?: {
    challengeType?: "HASHCASH" | "STAKE" | "DEVICE_ATTESTATION" | "NONE";
    challengeInput?: string;
    challengeOutput?: string;
    stakeAmount?: number;
    stakeAsset?: string;
  };
}

export interface Bid {
  bidId: string;
  taskId: string;
  agentId: string;
  phase: "COMMIT" | "REVEAL";
  commit?: {
    bidHash: string;
    committedAt: string;
  };
  reveal?: {
    nonce: string;
    price: {
      currency: string;
      amount: number;
    };
    executionPlan: {
      summary: string;
      etaSeconds: number;
      requiredTools?: string[];
    };
    proof?: ProofPack;
  };
}
