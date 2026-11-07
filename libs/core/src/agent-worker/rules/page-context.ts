import type { AgentWorkerPageContext } from '../entities/agent-worker-requests.js';

const CONTEXT_TAG = 'page_context';

/**
 * Where the person was, as a note the model reads next to their message, so "this product" or
 * "this store" resolve to ids it can pass to the tools. Null when there is nothing to say.
 */
export function describePageContext(context: AgentWorkerPageContext | undefined): string | null {
  if (!context) return null;
  const facts = [
    context.view ? `The person wrote from the app's ${context.view} page.` : null,
    context.productId ? `The product they are looking at has id ${context.productId}.` : null,
    context.connectionId ? `The store they are looking at has id ${context.connectionId}.` : null,
  ].filter((fact): fact is string => fact !== null);
  if (facts.length === 0) return null;
  return `<${CONTEXT_TAG}>\n${facts.join('\n')}\n</${CONTEXT_TAG}>`;
}
