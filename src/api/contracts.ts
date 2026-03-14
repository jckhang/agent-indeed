export type IdentityTier = "T0" | "T1" | "T2";

export type AgentBundleSchemaVersion = "1.0";
export type AgentRuntime = "OPENCLAW" | "CUSTOM_CONTAINER" | "WASM";
export type AgentMemoryMode = "INDEX_ONLY" | "ENCRYPTED_REF" | "FULL";
export type AgentMemoryScope = "DISCOVERY_ONLY" | "MATCHING_ONLY" | "TASK_RUNTIME";
export type SignatureAlgorithm = "ED25519" | "SECP256K1";

export interface AgentManifest {
  name: string;
  version: string;
  runtime: AgentRuntime;
  entrypoint: string;
  image?: string;
  checksum?: string;
}

export interface AgentIdentityAttestation {
  type: string;
  value: string;
}

export interface AgentIdentity {
  did: string;
  publicKey: string;
  credentialLevel: IdentityTier;
  issuer?: string;
  trustScore?: number;
  attestations?: AgentIdentityAttestation[];
}

export interface AgentSkillMetadata {
  skillId: string;
  version: string;
  tags?: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface AgentMemoryAccessPolicy {
  scope: AgentMemoryScope;
  ttlSeconds: number;
}

interface BaseAgentMemoryRef {
  summaryHash: string;
  accessPolicy?: AgentMemoryAccessPolicy;
}

export interface AgentMemoryRefIndexOnly extends BaseAgentMemoryRef {
  mode: "INDEX_ONLY";
  vectorIndexUri: string;
  encryptedBlobUri?: never;
}

export interface AgentMemoryRefEncrypted extends BaseAgentMemoryRef {
  mode: "ENCRYPTED_REF";
  encryptedBlobUri: string;
  vectorIndexUri?: string;
}

export interface AgentMemoryRefFull extends BaseAgentMemoryRef {
  mode: "FULL";
  encryptedBlobUri: string;
  vectorIndexUri?: string;
}

export type AgentMemoryRef =
  | AgentMemoryRefIndexOnly
  | AgentMemoryRefEncrypted
  | AgentMemoryRefFull;

export interface AgentBundleSignature {
  algorithm: SignatureAlgorithm;
  payloadHash: string;
  signature: string;
  signerDid: string;
  signedAt?: string;
}

export interface AgentBundle {
  schemaVersion: AgentBundleSchemaVersion;
  manifest: AgentManifest;
  identity: AgentIdentity;
  skills: AgentSkillMetadata[];
  memoryRef: AgentMemoryRef;
  signature: AgentBundleSignature;
}

export interface UploadAgentBundleRequest {
  idempotencyKey: string;
  bundle: AgentBundle;
}

export interface UploadAgentBundleCreatedResponse {
  agentId: string;
  version: string;
  status: "ACCEPTED" | "PENDING_REVIEW";
  result: "CREATED";
  indexing: UploadAgentBundleIndexingSummary;
  indexedAt?: string;
}

export interface AgentSkillIndexRecord {
  skillId: string;
  version: string;
  sourceAgentId: string;
  sourceVersion: string;
  tags?: string[];
}

export interface UploadAgentBundleIndexingSummary {
  status: "INDEXED";
  indexedSkillCount: number;
  memoryMode: AgentMemoryMode;
  skills: AgentSkillIndexRecord[];
}

export type AgentBundleValidationErrorCode =
  | "AGENT_BUNDLE_SCHEMA_INVALID"
  | "AGENT_BUNDLE_SCHEMA_UNSUPPORTED_VERSION"
  | "AGENT_BUNDLE_SIGNATURE_INVALID"
  | "AGENT_BUNDLE_SIGNATURE_SIGNER_MISMATCH"
  | "AGENT_BUNDLE_SIGNATURE_PAYLOAD_MISMATCH";

export type AgentBundleConflictErrorCode = "AGENT_BUNDLE_VERSION_CONFLICT";

export type AgentBundleErrorCode =
  | AgentBundleValidationErrorCode
  | AgentBundleConflictErrorCode;

export type AgentBundleErrorCategory = "SCHEMA" | "SIGNATURE" | "VERSION";

export interface AgentBundleValidationErrorDetails {
  fieldPath?: string;
  rule?: string;
  expected?: string;
  actual?: string;
}

export type AgentBundleConflictStrategy =
  | "RETURN_EXISTING_ON_HASH_MATCH"
  | "REJECT_ON_HASH_MISMATCH";

interface AgentBundleVersionDetailsBase {
  existingAgentId: string;
  existingVersion: string;
  existingPayloadHash: string;
  incomingPayloadHash: string;
}

export interface AgentBundleVersionReplayDetails
  extends AgentBundleVersionDetailsBase {
  strategy: "RETURN_EXISTING_ON_HASH_MATCH";
}

export interface AgentBundleVersionConflictDetails
  extends AgentBundleVersionDetailsBase {
  strategy: "REJECT_ON_HASH_MISMATCH";
}

export interface UploadAgentBundleReplayResponse {
  agentId: string;
  version: string;
  status: "EXISTING";
  result: "RETURNED_EXISTING";
  indexing: UploadAgentBundleIndexingSummary;
  replay: AgentBundleVersionReplayDetails;
  indexedAt?: string;
}

export type UploadAgentBundleResponse =
  | UploadAgentBundleCreatedResponse
  | UploadAgentBundleReplayResponse;

interface UploadAgentBundleErrorBase {
  message: string;
  auditId: string;
  retryable: boolean;
}

export interface UploadAgentBundleValidationErrorResponse
  extends UploadAgentBundleErrorBase {
  code: AgentBundleValidationErrorCode;
  category: "SCHEMA" | "SIGNATURE";
  details?: AgentBundleValidationErrorDetails;
  conflict?: never;
}

export interface UploadAgentBundleVersionConflictResponse
  extends UploadAgentBundleErrorBase {
  code: AgentBundleConflictErrorCode;
  category: "VERSION";
  details?: never;
  conflict: AgentBundleVersionConflictDetails;
}

export type UploadAgentBundleErrorResponse =
  | UploadAgentBundleValidationErrorResponse
  | UploadAgentBundleVersionConflictResponse;

export type ApiErrorCategory =
  | AgentBundleErrorCategory
  | "VALIDATION"
  | "IDEMPOTENCY"
  | "WINDOW"
  | "PRECONDITION"
  | "POLICY"
  | "VERIFICATION"
  | "AUDIT";

export type TaskCreateErrorCode =
  | "TASK_SPEC_CONSTRAINTS_MISSING"
  | "TASK_SPEC_POLICY_INVALID"
  | "TASK_CREATE_IDEMPOTENCY_CONFLICT";

export type BidCommitErrorCode =
  | "BID_COMMIT_PAYLOAD_INVALID"
  | "BID_COMMIT_TASK_MISMATCH"
  | "BID_COMMIT_WINDOW_CLOSED"
  | "BID_COMMIT_DUPLICATE";

export type BidRevealErrorCode =
  | "BID_REVEAL_PAYLOAD_INVALID"
  | "BID_REVEAL_COMMIT_NOT_FOUND"
  | "BID_REVEAL_HASH_MISMATCH"
  | "BID_REVEAL_WINDOW_CLOSED";

export type ProofVerifyErrorCode =
  | "PROOF_POLICY_INPUT_INVALID"
  | "PROOF_VERIFY_PAYLOAD_INVALID"
  | "PROOF_VERIFY_POLICY_INVALID"
  | "PROOF_VERIFY_FAILED"
  | "PROOF_VERIFY_NEEDS_REVIEW";

export type AwardAuditErrorCode =
  | "TASK_AWARD_PRECONDITION_FAILED"
  | "TASK_AWARD_PROOF_NOT_VERIFIED"
  | "TASK_AWARD_CANDIDATE_NOT_ELIGIBLE"
  | "AUDIT_QUERY_NOT_FOUND";

export type ApiErrorCode =
  | AgentBundleErrorCode
  | TaskCreateErrorCode
  | BidCommitErrorCode
  | BidRevealErrorCode
  | ProofVerifyErrorCode
  | AwardAuditErrorCode;

export interface ApiErrorResponse {
  code: ApiErrorCode;
  category: ApiErrorCategory;
  message: string;
  auditId: string;
  retryable: boolean;
  retryAfterSeconds?: number;
  details?: Record<string, unknown>;
}

export type ProofStrength = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type ProofChallengeProfile =
  | "SAMPLE_EXECUTION"
  | "HASHCASH"
  | "STAKE"
  | "HYBRID";

export interface ProofPolicyInputSnapshot {
  taskRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  taskValueScore: number;
  identityTier: IdentityTier;
  trustScore?: number;
}

export interface ProofVerifierParams {
  minSampleCount: number;
  minQualityScore?: number;
  maxRuntimeMs?: number;
  hashcashBits?: number;
  stakeMinAmount?: number;
}

export interface ProofPolicyDecision {
  policyTraceId: string;
  requiredProofStrength: ProofStrength;
  challengeProfile: ProofChallengeProfile;
  verifierParams: ProofVerifierParams;
  inputSnapshot: ProofPolicyInputSnapshot;
  rationale: string[];
  persistedAt: string;
}

export interface ResolveProofPolicyRequest {
  agentId: string;
  identityTier: IdentityTier;
  trustScore?: number;
}

export interface ProofPolicyDecisionResponse extends ProofPolicyDecision {
  taskId: string;
  agentId: string;
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

export type BidWindowPhase = "COMMIT_OPEN" | "REVEAL_OPEN" | "CLOSED";

export interface BidWindowSnapshot {
  currentPhase: BidWindowPhase;
  commitDeadline: string;
  revealDeadline: string;
  serverTime: string;
  nextAction:
    | "WAIT_FOR_REVEAL_WINDOW"
    | "SUBMIT_REVEAL"
    | "TRACK_PROOF_VERIFICATION"
    | "NO_FURTHER_ACTION";
}

export interface BidCommitCommand {
  bidId: string;
  taskId: string;
  agentId: string;
  bidHash: string;
  committedAt: string;
}

export interface BidRevealCommand {
  bidId: string;
  taskId: string;
  agentId: string;
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
  proof: ProofPack;
}

export type Bid = BidCommitCommand | BidRevealCommand;

export interface CommitBidRequest {
  idempotencyKey: string;
  commit: BidCommitCommand;
}

export interface RevealBidRequest {
  idempotencyKey: string;
  reveal: BidRevealCommand;
}

export interface BidProofSubmission {
  proofId: string;
  verificationStatus: "PENDING_VERIFY" | "PASS" | "FAIL" | "MANUAL_REVIEW";
}

export interface CommitBidAcceptedResponse {
  bidId: string;
  taskId: string;
  agentId: string;
  phase: "COMMIT";
  status: "COMMITTED";
  result: "COMMITTED" | "RETURNED_EXISTING";
  commit: BidCommitCommand;
  window: BidWindowSnapshot;
}

export interface RevealBidAcceptedResponse {
  bidId: string;
  taskId: string;
  agentId: string;
  phase: "REVEAL";
  status: "REVEALED" | "SCORED";
  result: "REVEALED" | "SCORED";
  rankingScore?: number;
  decisionTraceHash?: string;
  revealAcceptedAt: string;
  proofSubmission: BidProofSubmission;
  window: BidWindowSnapshot;
}

export interface CommitBidErrorResponse extends ApiErrorResponse {
  code: BidCommitErrorCode;
  details?: {
    bidId?: string;
    taskId?: string;
    currentPhase?: BidWindowPhase;
    commitDeadline?: string;
    revealDeadline?: string;
    serverTime?: string;
    existingCommitAuditId?: string;
  };
}

export interface RevealBidErrorResponse extends ApiErrorResponse {
  code: BidRevealErrorCode;
  details?: {
    bidId?: string;
    taskId?: string;
    currentPhase?: BidWindowPhase;
    commitRecordedAt?: string;
    revealDeadline?: string;
    expectedBidHash?: string;
  };
}

export interface VerifyProofPackRequest {
  proof: ProofPack;
}

export interface ProofVerificationResponse {
  proofId: string;
  result: "PASS" | "FAIL" | "MANUAL_REVIEW";
  requiredDifficulty: number;
  achievedDifficulty: number;
  reasonCodes?: string[];
  verifiedAt?: string;
}

export interface ProofVerifyErrorResponse extends ApiErrorResponse {
  code: ProofVerifyErrorCode;
  details?: {
    proofId?: string;
    taskId?: string;
    policyTraceId?: string;
    requiredDifficulty?: number;
    achievedDifficulty?: number;
  };
}

export type BidStatus = "COMMITTED" | "REVEALED" | "REJECTED" | "SCORED";

export interface BidResponse {
  bidId: string;
  taskId: string;
  agentId: string;
  phase: "COMMIT" | "REVEAL";
  status: BidStatus;
  rankingScore?: number;
  decisionTraceHash?: string;
}

export type ProofVerificationResult = "PASS" | "FAIL" | "MANUAL_REVIEW";

export interface VerifyProofPackRequest {
  policyTraceId: string;
  proof: ProofPack;
}

export interface ProofVerificationResponse {
  proofId: string;
  result: ProofVerificationResult;
  policyTraceId: string;
  requiredPolicy: ProofPolicyDecision;
  requiredDifficulty: number;
  achievedDifficulty: number;
  reasonCodes?: string[];
  verifiedAt?: string;
}
