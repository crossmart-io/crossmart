import { z } from 'zod';

/** One prediction of `GET /sites/{site_id}/domain_discovery/search`, best first. */
export const domainDiscoverySchema = z.array(
  z.object({
    domain_id: z.string(),
    category_id: z.string(),
    category_name: z.string(),
  }),
);

/** The fields Crossmart reads from `GET /categories/{category_id}`. */
export const mercadoLibreCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  path_from_root: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
});

export type MercadoLibreCategory = z.infer<typeof mercadoLibreCategorySchema>;

/**
 * An attribute's flags: an object of booleans in `/categories/{id}/attributes` (the technical
 * specs endpoints, which Crossmart does not read, send a list instead).
 */
const attributeTagsSchema = z
  .object({
    required: z.boolean().optional(),
    conditional_required: z.boolean().optional(),
    catalog_required: z.boolean().optional(),
    read_only: z.boolean().optional(),
    fixed: z.boolean().optional(),
    inferred: z.boolean().optional(),
    hidden: z.boolean().optional(),
    multivalued: z.boolean().optional(),
    allow_variations: z.boolean().optional(),
    variation_attribute: z.boolean().optional(),
  })
  .loose();

/** One attribute of `GET /categories/{category_id}/attributes` (Attributes guide). */
export const mercadoLibreAttributeSchema = z.object({
  id: z.string(),
  name: z.string(),
  tags: attributeTagsSchema.catch({}).default({}),
  value_type: z.string(),
  values: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
});

export type MercadoLibreAttribute = z.infer<typeof mercadoLibreAttributeSchema>;

export const mercadoLibreAttributesSchema = z.array(mercadoLibreAttributeSchema);
