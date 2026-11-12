import { Injectable } from '@nestjs/common';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import { MercadoLibreApiClient } from '../api/mercadolibre-api.client.js';
import {
  MERCADOLIBRE_CATEGORY_PATH,
  MERCADOLIBRE_CATEGORY_PATH_SEPARATOR,
  MERCADOLIBRE_CATEGORY_SUGGESTIONS_MAX,
  MERCADOLIBRE_DOMAIN_DISCOVERY_PATH,
  MercadoLibrePathParam,
  MercadoLibreQueryParam,
} from '../mercadolibre.constants.js';
import type { MercadoLibreSiteId } from '../mercadolibre-site.js';
import {
  domainDiscoverySchema,
  type MercadoLibreCategory,
  mercadoLibreCategorySchema,
} from './mercadolibre-taxonomy.types.js';

/** A category named with its ancestors: "Celulares y Teléfonos > Celulares y Smartphones". */
export function categoryPathName(category: MercadoLibreCategory): string {
  const path = category.path_from_root.length > 0 ? category.path_from_root : [category];
  return path.map((node) => node.name).join(MERCADOLIBRE_CATEGORY_PATH_SEPARATOR);
}

/**
 * Mercado Libre's categories: the predictor (`domain_discovery`) for a title, in the site's
 * language, and each predicted category read for its path, so merchants see where it sits.
 */
@Injectable()
export class MercadoLibreCategoryReader {
  constructor(private readonly api: MercadoLibreApiClient) {}

  async suggest(
    accessToken: string,
    siteId: MercadoLibreSiteId,
    query: string,
  ): Promise<ChannelCategory[]> {
    const predictions = await this.api.get(
      {
        accessToken,
        path: MERCADOLIBRE_DOMAIN_DISCOVERY_PATH,
        params: { [MercadoLibrePathParam.SiteId]: siteId },
        query: {
          [MercadoLibreQueryParam.Query]: query,
          [MercadoLibreQueryParam.Limit]: String(MERCADOLIBRE_CATEGORY_SUGGESTIONS_MAX),
        },
      },
      domainDiscoverySchema,
    );
    const categoryIds = [...new Set(predictions.map((prediction) => prediction.category_id))];
    return Promise.all(categoryIds.map((categoryId) => this.category(accessToken, categoryId)));
  }

  async category(accessToken: string, categoryId: string): Promise<ChannelCategory> {
    const category = await this.api.get(
      {
        accessToken,
        path: MERCADOLIBRE_CATEGORY_PATH,
        params: { [MercadoLibrePathParam.CategoryId]: categoryId },
      },
      mercadoLibreCategorySchema,
    );
    return { id: category.id, name: categoryPathName(category) };
  }
}
