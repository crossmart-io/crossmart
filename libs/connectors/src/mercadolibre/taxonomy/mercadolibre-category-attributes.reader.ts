import { Injectable } from '@nestjs/common';
import { MercadoLibreApiClient } from '../api/mercadolibre-api.client.js';
import {
  MERCADOLIBRE_ATTRIBUTES_CACHE_TTL_MS,
  MERCADOLIBRE_CATEGORY_ATTRIBUTES_PATH,
  MercadoLibrePathParam,
} from '../mercadolibre.constants.js';
import {
  type MercadoLibreAttribute,
  mercadoLibreAttributesSchema,
} from './mercadolibre-taxonomy.types.js';

interface CachedAttributes {
  attributes: MercadoLibreAttribute[];
  expiresAt: number;
}

/**
 * The attributes of a category (`GET /categories/{id}/attributes`). Publishing reads them to
 * send item specifics by attribute id, so each process keeps a category's for six hours.
 */
@Injectable()
export class MercadoLibreCategoryAttributesReader {
  private readonly cache = new Map<string, CachedAttributes>();

  constructor(private readonly api: MercadoLibreApiClient) {}

  async read(
    accessToken: string,
    categoryId: string,
    now = Date.now(),
  ): Promise<MercadoLibreAttribute[]> {
    const cached = this.cache.get(categoryId);
    if (cached && cached.expiresAt > now) return cached.attributes;
    const attributes = await this.api.get(
      {
        accessToken,
        path: MERCADOLIBRE_CATEGORY_ATTRIBUTES_PATH,
        params: { [MercadoLibrePathParam.CategoryId]: categoryId },
      },
      mercadoLibreAttributesSchema,
    );
    this.cache.set(categoryId, {
      attributes,
      expiresAt: now + MERCADOLIBRE_ATTRIBUTES_CACHE_TTL_MS,
    });
    return attributes;
  }
}
