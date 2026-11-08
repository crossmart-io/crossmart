import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  AGENT_WORKER_CONVERSATION_NOT_FOUND,
  AGENT_WORKER_HIGH_RISK_NOT_CONFIRMED,
  AGENT_WORKER_NO_PENDING_ACTIONS,
  AGENT_WORKER_TURN_IN_PROGRESS,
  AGENT_WORKER_UNKNOWN_ACTIONS,
} from '../agent-worker.constants.js';

/** Unknown, or someone else's: both answer the same, so ids do not leak. */
export class AgentWorkerConversationNotFoundError extends NotFoundException {
  constructor() {
    super(AGENT_WORKER_CONVERSATION_NOT_FOUND);
  }
}

/** One turn at a time per conversation. */
export class AgentWorkerTurnInProgressError extends ConflictException {
  constructor() {
    super(AGENT_WORKER_TURN_IN_PROGRESS);
  }
}

export class AgentWorkerNoPendingActionsError extends ConflictException {
  constructor() {
    super(AGENT_WORKER_NO_PENDING_ACTIONS);
  }
}

/** The decision names actions that are not waiting in this conversation. */
export class AgentWorkerUnknownActionsError extends BadRequestException {
  constructor() {
    super(AGENT_WORKER_UNKNOWN_ACTIONS);
  }
}

/** A deletion, price change or bulk change was approved without the explicit confirmation. */
export class AgentWorkerConfirmationRequiredError extends BadRequestException {
  constructor() {
    super(AGENT_WORKER_HIGH_RISK_NOT_CONFIRMED);
  }
}
