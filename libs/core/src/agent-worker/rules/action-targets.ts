import { z } from 'zod';
import type { AgentWorkerActionTargets } from '../entities/agent-worker-views.js';

/**
 * The inputs that name what a tool call is about. Every tool names a store `connectionId` and a
 * product `productId` (or several `productIds`), so these are read whatever the tool.
 */
const TARGET_INPUT = z.looseObject({
  connectionId: z.string().optional(),
  productId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
});

const NO_TARGETS: AgentWorkerActionTargets = { connectionIds: [], productIds: [] };

/** The stores and products a tool call names, each once; none for a workspace-wide call. */
export function actionTargets(input: unknown): AgentWorkerActionTargets {
  const parsed = TARGET_INPUT.safeParse(input);
  if (!parsed.success) return NO_TARGETS;
  const { connectionId, productId, productIds = [] } = parsed.data;
  return {
    connectionIds: connectionId ? [connectionId] : [],
    productIds: [...new Set([...(productId ? [productId] : []), ...productIds])],
  };
}
