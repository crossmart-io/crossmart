/**
 * Why a proposed change needs an explicit confirmation on top of the approval (ADR 0026).
 * Stored as text.
 */
export enum AgentWorkerActionRisk {
  /** Deletes something or takes it off sale. */
  Destructive = 'destructive',
  /** Changes what buyers pay. */
  PriceChange = 'price_change',
  /** Touches many products at once. */
  Bulk = 'bulk',
}
