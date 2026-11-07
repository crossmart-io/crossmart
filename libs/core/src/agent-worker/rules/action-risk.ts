import type { ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import { AGENT_WORKER_BULK_THRESHOLD } from '../agent-worker.constants.js';
import type { AgentWorkerActionPreview } from '../entities/agent-worker-views.js';
import { AgentWorkerActionRisk } from '../enums/agent-worker-action-risk.enum.js';
import { PRICE_LABEL } from './action-preview.js';

/** A proposed call and how many listings its confirmation publishes in all. */
export interface RiskInput {
  spec: ApiToolSpec;
  input: Record<string, unknown>;
  /** Listings every change in the same confirmation publishes. */
  publishesInBatch: number;
  /** What the change would do; a preview read from the API settles whether prices change. */
  preview?: AgentWorkerActionPreview;
}

function namesManyItems(input: Record<string, unknown>): boolean {
  return Object.values(input).some(
    (value) => Array.isArray(value) && value.length > AGENT_WORKER_BULK_THRESHOLD,
  );
}

/**
 * True when the call sets a price input. With a preview read from the API (it names a target),
 * only a price that actually differs counts, so resending today's prices is not a price change.
 */
function changesPrices({ spec, input, preview }: RiskInput): boolean {
  const setsPrice = (spec.priceInputs ?? []).some((field) => input[field] !== undefined);
  if (!setsPrice || !preview?.target) return setsPrice;
  return preview.changes.some((change) => change.field.startsWith(PRICE_LABEL));
}

/**
 * Why a change needs an explicit confirmation (ADR 0026): it deletes or takes something off
 * sale, it changes prices, or it touches many products (one call naming many, or a confirmation
 * publishing many).
 */
export function assessRisks(call: RiskInput): AgentWorkerActionRisk[] {
  const { spec, input, publishesInBatch } = call;
  const risks: AgentWorkerActionRisk[] = [];
  if (spec.destructive) risks.push(AgentWorkerActionRisk.Destructive);
  if (changesPrices(call)) risks.push(AgentWorkerActionRisk.PriceChange);
  const bulkPublish = spec.publishes === true && publishesInBatch > AGENT_WORKER_BULK_THRESHOLD;
  if (bulkPublish || namesManyItems(input)) risks.push(AgentWorkerActionRisk.Bulk);
  return risks;
}
