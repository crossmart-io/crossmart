import { SetMetadata } from '@nestjs/common';
import { AGENT_APPROVAL_EXEMPT_METADATA_KEY } from '../agent-proposals.constants.js';

/**
 * Keeps a write route open to outside agents while their changes need approval (ADR 0028), for
 * writes that change nothing by themselves: proposing, or asking for AI content that arrives as
 * suggestions.
 */
export const AgentApprovalExempt = (): MethodDecorator & ClassDecorator =>
  SetMetadata(AGENT_APPROVAL_EXEMPT_METADATA_KEY, true);
