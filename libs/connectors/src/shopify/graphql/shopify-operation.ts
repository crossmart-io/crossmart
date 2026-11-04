import type { z } from 'zod';

/**
 * A GraphQL document with the schema its `data` must match. Every response is validated, so a
 * changed or unexpected payload fails clearly instead of flowing on as untyped JSON.
 */
export interface ShopifyOperation<TData, TVariables extends object = Record<string, never>> {
  /** Named in errors and logs instead of the document. */
  readonly name: string;
  readonly document: string;
  readonly schema: z.ZodType<TData>;
  /** Phantom field that ties variables to the operation; never set. */
  readonly variables?: TVariables;
}
