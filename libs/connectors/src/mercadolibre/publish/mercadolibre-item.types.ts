import { z } from 'zod';

/**
 * An attribute as items take it: by the category's attribute `id`, or by `name` for a custom
 * attribute (User Products). `value_name` holds the value; several are comma-separated.
 */
export interface MercadoLibreAttributeInput {
  id?: string;
  name?: string;
  value_name: string;
}

/** A picture by its public URL; Mercado Libre downloads it. */
export interface MercadoLibrePictureInput {
  source: string;
}

/** A variation of a single item (sellers without User Products). */
export interface MercadoLibreVariationInput {
  id?: number;
  price: number;
  available_quantity: number;
  attribute_combinations?: MercadoLibreAttributeInput[];
  attributes?: MercadoLibreAttributeInput[];
  picture_ids?: string[];
  /** Crossmart's variant id, so the created variation can be matched to it. */
  seller_custom_field?: string;
}

/** The body of `POST /items` and `PUT /items/{id}`; each write sends only what applies. */
export interface MercadoLibreItemInput {
  title?: string;
  family_name?: string;
  category_id?: string;
  price?: number;
  currency_id?: string;
  available_quantity?: number;
  buying_mode?: string;
  condition?: string;
  listing_type_id?: string;
  pictures?: MercadoLibrePictureInput[];
  attributes?: MercadoLibreAttributeInput[];
  variations?: MercadoLibreVariationInput[];
  status?: string;
}

/** A stock or price change of one variation, in a `PUT /items/{id}` that lists them all. */
export interface MercadoLibreVariationUpdate {
  id: number;
  available_quantity?: number;
  price?: number;
}

/** The fields Crossmart reads from an item (`POST /items`, `GET` and `PUT /items/{id}`). */
export const mercadoLibreItemSchema = z.object({
  id: z.string(),
  status: z.string(),
  permalink: z.string().nullish(),
  sold_quantity: z.number().int().default(0),
  family_name: z.string().nullish(),
  variations: z
    .array(
      z.object({
        id: z.number().int(),
        price: z.number().optional(),
        available_quantity: z.number().int().optional(),
        seller_custom_field: z.string().nullish(),
      }),
    )
    .default([]),
});

export type MercadoLibreItem = z.infer<typeof mercadoLibreItemSchema>;

/** `POST` and `PUT /items/{id}/description` answer the description; Crossmart reads nothing. */
export const mercadoLibreDescriptionSchema = z.object({}).loose();
