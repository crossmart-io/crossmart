import type { AgentWorkerContextView } from '../enums/agent-worker-context-view.enum.js';
import type { AgentWorkerOwner } from './agent-worker-owner.js';

/** Where the person was when they wrote, so "this product" means something. */
export interface AgentWorkerPageContext {
  view?: AgentWorkerContextView;
  productId?: string;
  connectionId?: string;
}

export interface AgentWorkerMessageRequest {
  owner: AgentWorkerOwner;
  conversationId: string;
  text: string;
  context?: AgentWorkerPageContext;
}

/**
 * The person's decision on every change waiting in a conversation: those listed are approved,
 * the others rejected. Deletions, price changes and bulk changes also need `confirmHighRisk`.
 */
export interface AgentWorkerDecisionRequest {
  owner: AgentWorkerOwner;
  conversationId: string;
  approvedActionIds: string[];
  confirmHighRisk: boolean;
}

export interface AgentWorkerConversationQuery {
  page: number;
  limit: number;
}
