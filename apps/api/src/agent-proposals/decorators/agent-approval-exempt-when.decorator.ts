import { SetMetadata } from '@nestjs/common';
import type { AgentApprovalExemption } from '@crossmart/core';
import { AGENT_APPROVAL_EXEMPT_WHEN_METADATA_KEY } from '../agent-proposals.constants.js';

/**
 * Lets an outside agent call a write route while its changes need approval, but only when the
 * request body qualifies for the exemption (ADR 0028, amended): creating a product as a draft.
 * Any other body is refused with `agent_approval_required`, so the agent proposes it.
 */
export const AgentApprovalExemptWhen = (exemption: AgentApprovalExemption): MethodDecorator =>
  SetMetadata(AGENT_APPROVAL_EXEMPT_WHEN_METADATA_KEY, exemption);
