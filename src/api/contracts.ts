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

export interface TaskWriteContextHeaders {
  workspaceId: string;
}

export interface ProofVerifyRequestContext {
  auditReason?: string;
}

export interface CreateTaskRequest {
  task: TaskSpec;
}

export interface CreateTaskHttpRequest {
  headers: TaskWriteContextHeaders;
  body: CreateTaskRequest;
}

export interface VerifyProofPackHttpRequest {
  headers: ProofVerifyRequestContext;
  body: VerifyProofPackRequest;
}

export interface CreateTaskResponse {
  taskId: string;
  status: "OPEN_FOR_MATCHING" | "OPEN_FOR_BIDDING";
  commitDeadline?: string;
  revealDeadline?: string;
}

export interface TaskRecordResponse {
  taskId: string;
  workspaceId: string;
  status: "OPEN_FOR_MATCHING" | "OPEN_FOR_BIDDING";
  createdAt: string;
  commitDeadline: string;
  revealDeadline: string;
  task: TaskSpec;
}

export type AuditEntityType = "task" | "bid" | "proof" | "award" | "audit";

export interface AuditEventRecord {
  auditId: string;
  eventType: string;
  entityType: AuditEntityType;
  entityId: string;
  taskId: string | null;
  summary: string;
  recordedAt: string;
}

export interface TaskAuditEventListResponse {
  taskId: string;
  count: number;
  events: AuditEventRecord[];
}

export interface RuntimeHealthResponse {
  status: "ok";
  service: string;
  now: string;
  uptimeSeconds: number;
}

export interface RuntimeReadinessCheck {
  name: "config" | "storage";
  status: "ok";
}

export interface RuntimeStorageSummary {
  tasks: number;
  bids: number;
  proofs: number;
  awards: number;
  auditEvents: number;
  latestTaskId: string | null;
  latestAuditId: string | null;
}

export interface RuntimeReadinessResponse {
  status: "ready";
  service: string;
  checks: RuntimeReadinessCheck[];
  storage: RuntimeStorageSummary;
}

export interface RuntimeSummaryResponse {
  service: string;
  generatedAt: string;
  storage: RuntimeStorageSummary;
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
  | "MATCHING"
  | "WINDOW"
  | "PRECONDITION"
  | "POLICY"
  | "VERIFICATION"
  | "AUDIT";

export type TaskCreateErrorCode =
  | "TASK_SPEC_CONSTRAINTS_MISSING"
  | "TASK_SPEC_POLICY_INVALID"
  | "TASK_CREATE_IDEMPOTENCY_CONFLICT";

export type CandidateMatchErrorCode =
  | "TASK_MATCH_TASK_NOT_FOUND"
  | "TASK_MATCH_NOT_READY"
  | "TASK_MATCH_LIMIT_INVALID";

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
  | "PROOF_POLICY_TRACE_MISSING"
  | "PROOF_POLICY_TRACE_NOT_FOUND"
  | "PROOF_VERIFY_PAYLOAD_INVALID"
  | "PROOF_VERIFY_POLICY_INVALID"
  | "PROOF_VERIFY_FAILED"
  | "PROOF_VERIFY_NEEDS_REVIEW";

export type BidStatusErrorCode = "BID_STATUS_NOT_FOUND";
export type ProofStatusErrorCode = "PROOF_STATUS_NOT_FOUND";

export type AwardAuditErrorCode =
  | "TASK_AWARD_PRECONDITION_FAILED"
  | "TASK_AWARD_PROOF_NOT_VERIFIED"
  | "TASK_AWARD_CANDIDATE_NOT_ELIGIBLE"
  | "TASK_AWARD_IDEMPOTENCY_CONFLICT"
  | "AUDIT_QUERY_NOT_FOUND";

export type ApiErrorCode =
  | AgentBundleErrorCode
  | TaskCreateErrorCode
  | CandidateMatchErrorCode
  | BidCommitErrorCode
  | BidRevealErrorCode
  | BidStatusErrorCode
  | ProofStatusErrorCode
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

export type CandidateEligibilityGate =
  | "IDENTITY_TIER"
  | "REQUIRED_SKILL"
  | "COMPLIANCE";

export interface CandidateEligibilityCheck {
  gate: CandidateEligibilityGate;
  status: "PASSED" | "FAILED" | "NOT_REQUESTED";
  detail?: string;
}

export type CandidateRankingFactorType =
  | "SUCCESS_RATE"
  | "LATENCY"
  | "BUDGET_FIT"
  | "HISTORICAL_SIMILARITY";

export interface CandidateRankingFactor {
  factor: CandidateRankingFactorType;
  weight: number;
  rawScore: number;
  weightedScore: number;
  rationale?: string;
}

export interface CandidateRankingBreakdown {
  totalScore: number;
  factors: CandidateRankingFactor[];
}

export type CandidateMissingDataStatus = "BLOCKING" | "WARNING";

export type CandidateMissingDataCode =
  | "NO_ACTIVE_BID"
  | "PROOF_PENDING"
  | "PROOF_MANUAL_REVIEW"
  | "PROFILE_STALE"
  | "AUDIT_GAP";

export interface CandidateMissingDataState {
  code: CandidateMissingDataCode;
  status: CandidateMissingDataStatus;
  message: string;
  auditId?: string;
}

export type CandidateProofReadinessStatus =
  | "READY"
  | "PENDING"
  | "FAILED"
  | "NEEDS_REVIEW";

export interface CandidateProofReadiness {
  status: CandidateProofReadinessStatus;
  proofId?: string;
  result?: ProofVerificationStatus;
  reasonCodes?: ProofVerificationReasonCode[];
  auditId?: string;
}

interface CandidateMatchBase {
  agentId: string;
  matchingTraceId: string;
  identityTier: IdentityTier;
  matchedSkills: string[];
  missingRequiredSkills?: string[];
  complianceStatus: "PASSED" | "FAILED" | "NOT_REQUESTED";
  eligibilityChecks: CandidateEligibilityCheck[];
  bidId?: string;
  missingDataStates?: CandidateMissingDataState[];
  proofReadiness?: CandidateProofReadiness;
  shortlistAuditId?: string;
  decisionTraceHash?: string;
}

export interface EligibleCandidateMatch extends CandidateMatchBase {
  eligible: true;
  rank: number;
  scoreBreakdown?: CandidateRankingBreakdown;
}

export interface IneligibleCandidateMatch extends CandidateMatchBase {
  eligible: false;
  rank?: never;
  scoreBreakdown?: never;
}

export type CandidateMatch =
  | EligibleCandidateMatch
  | IneligibleCandidateMatch;

export interface CandidateMatchListResponse {
  taskId: string;
  status: "MATCHED" | "NO_ELIGIBLE_CANDIDATES";
  generatedAt: string;
  candidates: CandidateMatch[];
}

export type ProofSchemaVersion = "1.0";

export interface ProofIdentityProof {
  credentialLevel: IdentityTier;
  signerDid: string;
  signature: string;
  attestationRefs?: string[];
}

export interface ProofSampleWork {
  sampleTaskDigest: string;
  outputDigest: string;
  qualityScore?: number;
  runtimeMs?: number;
}

export interface ProofExecutionTrace {
  traceHash: string;
  traceUri: string;
  traceSignature: string;
  toolCallCount?: number;
}

export interface ProofAntiSybilChallenge {
  challengeType?: "HASHCASH" | "STAKE" | "DEVICE_ATTESTATION" | "NONE";
  challengeInput?: string;
  challengeOutput?: string;
  stakeAmount?: number;
  stakeAsset?: string;
}

export type ProofVerificationStatus = "PASS" | "FAIL" | "MANUAL_REVIEW";

export type ProofVerificationReasonCode =
  | "IDENTITY_TIER_MISMATCH"
  | "SAMPLE_COUNT_BELOW_MINIMUM"
  | "QUALITY_SCORE_BELOW_MINIMUM"
  | "RUNTIME_EXCEEDED"
  | "TRACE_SIGNATURE_INVALID"
  | "HASHCASH_BITS_BELOW_MINIMUM"
  | "STAKE_AMOUNT_BELOW_MINIMUM"
  | "DEVICE_ATTESTATION_MISSING"
  | "MANUAL_REVIEW_REQUIRED";

export interface ProofPack {
  proofSchemaVersion: ProofSchemaVersion;
  proofId: string;
  taskId: string;
  agentId: string;
  capturedAt: string;
  identityProof: ProofIdentityProof;
  sampleWork: ProofSampleWork;
  executionTrace: ProofExecutionTrace;
  antiSybil?: ProofAntiSybilChallenge;
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
  verificationStatus: "PENDING_VERIFY" | ProofVerificationStatus;
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
  policyTraceId: string;
  proof: ProofPack;
}

export interface ProofVerificationResponse {
  proofId: string;
  result: ProofVerificationStatus;
  policyTraceId: string;
  requiredPolicy: ProofPolicyDecision;
  requiredDifficulty: number;
  achievedDifficulty: number;
  decisionTraceHash?: string;
  reasonCodes?: ProofVerificationReasonCode[];
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
    decisionTraceHash?: string;
    reasonCodes?: ProofVerificationReasonCode[];
  };
}

export type AwardStatus = "PENDING_REVIEW" | "READY_TO_AWARD" | "AWARDED" | "BLOCKED";

export type AwardHandoffStatus = "PENDING" | "READY" | "SENT";

export interface AwardProofSummary {
  proofId: string;
  result: ProofVerificationStatus;
  reasonCodes?: ProofVerificationReasonCode[];
  requiredDifficulty?: number;
  achievedDifficulty?: number;
  verifiedAt?: string;
  auditId: string;
}

export interface AwardHandoffSummary {
  status: AwardHandoffStatus;
  handoffChannel?: "API" | "WEBHOOK" | "MANUAL_EXPORT";
  destinationRef?: string;
  checklist?: string[];
}

export interface AwardDecisionDetail {
  taskId: string;
  status: AwardStatus;
  statusMessage: string;
  shortlistedBidId?: string;
  awardedBidId?: string;
  awardedAgentId?: string;
  awardReason?: string;
  managerDecisionNote?: string;
  shortlistAuditId?: string;
  proofAuditId?: string;
  proofSummary?: AwardProofSummary;
  decisionTraceHash?: string;
  auditEventId?: string;
  handoff: AwardHandoffSummary;
  reviewedAt?: string;
  awardedAt?: string;
}

export interface CreateTaskAwardRequest {
  idempotencyKey: string;
  award: {
    bidId: string;
    awardReason: string;
    managerDecisionNote?: string;
    shortlistAuditId: string;
    proofAuditId: string;
  };
}

export interface TaskAwardRequest {
  bidId: string;
  awardReason?: string;
}

export interface TaskAwardResponse {
  awardId: string;
  taskId: string;
  status: "AWARDED";
  awardedBidId: string;
  awardedAgentId: string;
  awardedAt: string;
  decisionTraceHash: string;
  scoreSummary: TaskAwardScoreSummary;
  proofSummary: TaskAwardProofSummary;
  awardReason?: string;
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
  proofId?: string;
  statusChangedAt?: string;
  failureReasonCodes?: BidStatusReasonCode[];
  auditId?: string;
}

export type ProofVerificationResult = ProofVerificationStatus;

export type AuditEventType =
  | "TASK_CREATED"
  | "BID_COMMITTED"
  | "BID_REVEALED"
  | "POMW_VERIFIED"
  | "TASK_AWARDED";

export type AuditActorRole =
  | "MANAGER"
  | "AGENT"
  | "SYSTEM"
  | "OPERATOR"
  | "VERIFIER_SERVICE";

export type AuditTaskLifecycleState =
  | "OPEN_FOR_MATCHING"
  | "OPEN_FOR_BIDDING"
  | "VERIFYING"
  | "AWARDED"
  | "CLOSED_NO_AWARD";

export type AuditRecordCompleteness = "COMPLETE" | "PARTIAL";

export interface TaskCreatedAuditPayload {
  taskStatus: "OPEN_FOR_MATCHING" | "OPEN_FOR_BIDDING";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  proofPolicyMode: "AUTO_TIERED" | "MANUAL";
}

export interface BidCommittedAuditPayload {
  bidHash: string;
  windowPhase: BidWindowPhase;
  commitDeadline: string;
}

export interface BidRevealedAuditPayload {
  price: {
    currency: string;
    amount: number;
  };
  proofId: string;
  rankingScore?: number;
  decisionTraceHash?: string;
}

export interface ProofVerifiedAuditPayload {
  result: ProofVerificationResult;
  policyTraceId: string;
  requiredDifficulty: number;
  achievedDifficulty: number;
  decisionTraceHash?: string;
  reasonCodes?: ProofVerificationReasonCode[];
  manualReviewRequired: boolean;
}

export interface TaskAwardScoreSummary {
  rankingScore: number;
  budgetFitScore?: number;
  latencyScore?: number;
}

export interface TaskAwardProofSummary {
  proofId?: string;
  result: ProofVerificationResult;
  decisionTraceHash?: string;
  reasonCodes?: ProofVerificationReasonCode[];
  policyTraceId?: string;
}

export interface TaskAwardedAuditPayload {
  awardedBidId: string;
  awardedAgentId: string;
  taskStatus: "AWARDED" | "CLOSED_NO_AWARD";
  awardReason?: string;
  decisionTraceHash: string;
  scoreSummary: TaskAwardScoreSummary;
  proofSummary: TaskAwardProofSummary;
}

interface AuditEventBase {
  eventId: string;
  eventType: AuditEventType;
  taskId: string;
  bidId?: string;
  proofId?: string;
  actorRole: AuditActorRole;
  actorId?: string;
  occurredAt: string;
  auditId: string;
  traceHash: string;
  payloadVersion: string;
  summary: string;
  completeness: AuditRecordCompleteness;
  missingFields?: string[];
}

export interface TaskCreatedAuditEvent extends AuditEventBase {
  eventType: "TASK_CREATED";
  payload: TaskCreatedAuditPayload;
}

export interface BidCommittedAuditEvent extends AuditEventBase {
  eventType: "BID_COMMITTED";
  bidId: string;
  payload: BidCommittedAuditPayload;
}

export interface BidRevealedAuditEvent extends AuditEventBase {
  eventType: "BID_REVEALED";
  bidId: string;
  proofId: string;
  payload: BidRevealedAuditPayload;
}

export interface ProofVerifiedAuditEvent extends AuditEventBase {
  eventType: "POMW_VERIFIED";
  bidId: string;
  proofId: string;
  payload: ProofVerifiedAuditPayload;
}

export interface TaskAwardedAuditEvent extends AuditEventBase {
  eventType: "TASK_AWARDED";
  bidId: string;
  payload: TaskAwardedAuditPayload;
}

export type AuditEvent =
  | TaskCreatedAuditEvent
  | BidCommittedAuditEvent
  | BidRevealedAuditEvent
  | ProofVerifiedAuditEvent
  | TaskAwardedAuditEvent;

export interface AuditEventListResponse {
  taskId: string;
  bidId?: string;
  hasMore: boolean;
  nextCursor?: string;
  events: AuditEvent[];
}

export type BidPhase = "COMMIT" | "REVEAL";
export type BidWriteStatus = "COMMITTED" | "REVEALED" | "REJECTED" | "SCORED";
export type ProofResult = ProofVerificationResult;
export type RefreshMode = "POLL";

export interface RefreshPolicy {
  mode: RefreshMode;
  pollAfterSeconds: number;
  manualRefreshAllowed: boolean;
  lastUpdatedAt: string;
}

export type BidStatusReasonCode =
  | "BID_COMMIT_WINDOW_CLOSED"
  | "BID_COMMIT_DUPLICATE"
  | BidRevealErrorCode
  | "PROOF_VERIFY_FAILED"
  | "PROOF_VERIFY_NEEDS_REVIEW";

export type ProofStatusReasonCode =
  | "PROOF_VERIFY_FAILED"
  | "PROOF_VERIFY_NEEDS_REVIEW"
  | "PROOF_VERIFY_PAYLOAD_INVALID"
  | "PROOF_VERIFY_POLICY_INVALID";

export type BidCommitState = "PENDING" | "COMMITTED" | "REJECTED";
export type BidRevealState = "WAITING_FOR_WINDOW" | "READY" | "REVEALED" | "REJECTED";
export type ProofState =
  | "NOT_SUBMITTED"
  | "QUEUED"
  | "VERIFYING"
  | ProofVerificationStatus
  | "OVERRIDDEN";
export type AwardState = "NOT_DECIDED" | "SHORTLISTED" | "AWARDED" | "NOT_SELECTED";

export interface BidStatusDeadlines {
  commitDeadline: string;
  revealDeadline: string;
}

export interface BidStatusProofSummary {
  proofId: string;
  result?: ProofResult;
  reasonCodes?: ProofStatusReasonCode[];
  verifiedAt?: string;
  decisionTraceHash?: string;
}

export interface BidStatusAuditRefs {
  bidAuditId?: string;
  proofAuditId?: string;
  decisionTraceHash?: string;
}

export interface BidStatusResponse {
  bidId: string;
  taskId: string;
  agentId: string;
  latestPhase: BidPhase;
  commitState: BidCommitState;
  revealState: BidRevealState;
  proofState: ProofState;
  awardState: AwardState;
  deadlines?: BidStatusDeadlines;
  proof?: BidStatusProofSummary;
  failureReasonCodes?: BidStatusReasonCode[];
  auditRefs?: BidStatusAuditRefs;
  refresh: RefreshPolicy;
}

export type ProofVerificationState =
  | "QUEUED"
  | "VERIFYING"
  | ProofVerificationStatus
  | "OVERRIDDEN";

export interface ProofStatusResponse {
  proofId: string;
  taskId: string;
  bidId?: string;
  agentId: string;
  verificationState: ProofVerificationState;
  requiredDifficulty?: number;
  achievedDifficulty?: number;
  reasonCodes?: ProofStatusReasonCode[];
  needsManualReview?: boolean;
  decisionTraceHash?: string;
  verifiedAt?: string;
  refresh: RefreshPolicy;
}
