import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AGENT_PROPOSAL_COPY } from '../agent-proposals.constants.js';

export class AgentProposalNotFoundError extends NotFoundException {
  constructor() {
    super(AGENT_PROPOSAL_COPY.notFound);
  }
}

export class AgentProposalNotPendingError extends ConflictException {
  constructor() {
    super(AGENT_PROPOSAL_COPY.notPending);
  }
}

export class AgentProposalRiskNotConfirmedError extends BadRequestException {
  constructor() {
    super(AGENT_PROPOSAL_COPY.highRiskNotConfirmed);
  }
}

export class AgentProposalToolError extends BadRequestException {}

export class AgentProposalForbiddenError extends ForbiddenException {}
