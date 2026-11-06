import { z } from 'zod';

/** A seller taxonomy node, with its children (`getSellerTaxonomyNodes`). */
export interface EtsyTaxonomyNode {
  id: number;
  name: string;
  children: EtsyTaxonomyNode[];
}

const nodeSchema: z.ZodType<EtsyTaxonomyNode> = z.lazy(() =>
  z.object({
    id: z.number().int().positive(),
    name: z.string(),
    children: z.array(nodeSchema).default([]),
  }),
);

export const etsyTaxonomySchema = z.object({ results: z.array(nodeSchema) });
