import { IdSequence } from "../lib/id-sequence.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class InMemoryControlPlaneStore {
  constructor({ now = () => new Date().toISOString() } = {}) {
    this.now = now;
    this.tasks = new Map();
    this.bids = new Map();
    this.proofs = new Map();
    this.awards = new Map();
    this.auditEvents = new Map();
    this.taskIds = new IdSequence("task");
    this.bidIds = new IdSequence("bid");
    this.proofIds = new IdSequence("proof");
    this.awardIds = new IdSequence("award");
    this.auditIds = new IdSequence("audit");
  }

  createTask({ workspaceId, task }) {
    const taskId = this.taskIds.next();
    const createdAt = this.now();
    const record = {
      taskId,
      workspaceId,
      task: clone(task),
      status: "OPEN_FOR_MATCHING",
      createdAt,
      commitDeadline: task.biddingWindow.commitDeadline,
      revealDeadline: task.biddingWindow.revealDeadline
    };

    this.tasks.set(taskId, record);
    const auditEvent = this.appendAuditEvent({
      eventType: "TASK_CREATED",
      entityType: "task",
      entityId: taskId,
      taskId,
      summary: `${task.title} created for workspace ${workspaceId}`
    });

    return {
      record: clone(record),
      auditEvent
    };
  }

  getTask(taskId) {
    const record = this.tasks.get(taskId);
    return record ? clone(record) : null;
  }

  createBid({ taskId, agentId, commit }) {
    const bidId = this.bidIds.next();
    const record = {
      bidId,
      taskId,
      agentId,
      status: "COMMITTED",
      commit: clone(commit),
      createdAt: this.now()
    };

    this.bids.set(bidId, record);
    const auditEvent = this.appendAuditEvent({
      eventType: "BID_COMMITTED",
      entityType: "bid",
      entityId: bidId,
      taskId,
      summary: `Bid ${bidId} committed for task ${taskId}`
    });

    return {
      record: clone(record),
      auditEvent
    };
  }

  createProof({ taskId, bidId, proof }) {
    const proofId = this.proofIds.next();
    const record = {
      proofId,
      taskId,
      bidId,
      status: "SUBMITTED",
      proof: clone(proof),
      createdAt: this.now()
    };

    this.proofs.set(proofId, record);
    const auditEvent = this.appendAuditEvent({
      eventType: "PROOF_SUBMITTED",
      entityType: "proof",
      entityId: proofId,
      taskId,
      summary: `Proof ${proofId} submitted for task ${taskId}`
    });

    return {
      record: clone(record),
      auditEvent
    };
  }

  createAward({ taskId, bidId, award }) {
    const awardId = this.awardIds.next();
    const record = {
      awardId,
      taskId,
      bidId,
      status: "AWARDED",
      award: clone(award),
      createdAt: this.now()
    };

    this.awards.set(awardId, record);
    const auditEvent = this.appendAuditEvent({
      eventType: "AWARD_DECIDED",
      entityType: "award",
      entityId: awardId,
      taskId,
      summary: `Award ${awardId} decided for task ${taskId}`
    });

    return {
      record: clone(record),
      auditEvent
    };
  }

  listAuditEventsForTask(taskId) {
    return Array.from(this.auditEvents.values())
      .filter((event) => event.taskId === taskId || event.entityId === taskId)
      .map((event) => clone(event));
  }

  appendAuditEvent({ eventType, entityType, entityId, summary, taskId = null }) {
    const auditId = this.auditIds.next();
    const event = {
      auditId,
      eventType,
      entityType,
      entityId,
      taskId,
      summary,
      recordedAt: this.now()
    };

    this.auditEvents.set(auditId, event);
    return clone(event);
  }

  summary() {
    return {
      tasks: this.tasks.size,
      bids: this.bids.size,
      proofs: this.proofs.size,
      awards: this.awards.size,
      auditEvents: this.auditEvents.size,
      latestTaskId: Array.from(this.tasks.keys()).at(-1) ?? null,
      latestAuditId: Array.from(this.auditEvents.keys()).at(-1) ?? null
    };
  }
}
