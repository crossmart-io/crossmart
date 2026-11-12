import { Injectable } from '@nestjs/common';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { MercadoLibreApiClient } from '../api/mercadolibre-api.client.js';
import {
  MERCADOLIBRE_DESCRIPTION_API_VERSION,
  MERCADOLIBRE_ITEM_DESCRIPTION_PATH,
  MERCADOLIBRE_ITEM_PATH,
  MERCADOLIBRE_ITEMS_PATH,
  MercadoLibrePathParam,
  MercadoLibreQueryParam,
} from '../mercadolibre.constants.js';
import type { MercadoLibreItemStatus } from '../mercadolibre.enums.js';
import {
  type MercadoLibreItem,
  type MercadoLibreItemInput,
  type MercadoLibreVariationUpdate,
  mercadoLibreDescriptionSchema,
  mercadoLibreItemSchema,
} from './mercadolibre-item.types.js';

function itemParams(itemId: string): Partial<Record<MercadoLibrePathParam, string>> {
  return { [MercadoLibrePathParam.ItemId]: itemId };
}

/** Items and their descriptions (List products, Item description and Products sync guides). */
@Injectable()
export class MercadoLibreItemClient {
  constructor(private readonly api: MercadoLibreApiClient) {}

  create(accessToken: string, body: MercadoLibreItemInput): Promise<MercadoLibreItem> {
    return this.api.call(
      { method: HttpMethod.Post, accessToken, path: MERCADOLIBRE_ITEMS_PATH, body },
      mercadoLibreItemSchema,
    );
  }

  /** The item, or null when Mercado Libre no longer has it. */
  find(accessToken: string, itemId: string): Promise<MercadoLibreItem | null> {
    return this.api.find(
      { accessToken, path: MERCADOLIBRE_ITEM_PATH, params: itemParams(itemId) },
      mercadoLibreItemSchema,
    );
  }

  update(
    accessToken: string,
    itemId: string,
    body: MercadoLibreItemInput | { variations: MercadoLibreVariationUpdate[] },
  ): Promise<MercadoLibreItem> {
    return this.api.call(
      {
        method: HttpMethod.Put,
        accessToken,
        path: MERCADOLIBRE_ITEM_PATH,
        params: itemParams(itemId),
        body,
      },
      mercadoLibreItemSchema,
    );
  }

  setStatus(
    accessToken: string,
    itemId: string,
    status: MercadoLibreItemStatus,
  ): Promise<MercadoLibreItem> {
    return this.update(accessToken, itemId, { status });
  }

  /** A new item's description; descriptions are sent after the item is created. */
  async addDescription(accessToken: string, itemId: string, plainText: string): Promise<void> {
    await this.api.call(
      {
        method: HttpMethod.Post,
        accessToken,
        path: MERCADOLIBRE_ITEM_DESCRIPTION_PATH,
        params: itemParams(itemId),
        body: { plain_text: plainText },
      },
      mercadoLibreDescriptionSchema,
    );
  }

  /** Replaces the description of an item that has one. */
  async replaceDescription(accessToken: string, itemId: string, plainText: string): Promise<void> {
    await this.api.call(
      {
        method: HttpMethod.Put,
        accessToken,
        path: MERCADOLIBRE_ITEM_DESCRIPTION_PATH,
        params: itemParams(itemId),
        query: { [MercadoLibreQueryParam.ApiVersion]: MERCADOLIBRE_DESCRIPTION_API_VERSION },
        body: { plain_text: plainText },
      },
      mercadoLibreDescriptionSchema,
    );
  }
}
