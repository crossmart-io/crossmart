import { Injectable } from '@nestjs/common';
import { chunk } from '@crossmart/common';
import { z } from 'zod';
import type { FalabellaAccount } from '../api/falabella-account.js';
import { FalabellaApiClient } from '../api/falabella-api.client.js';
import { xmlList, xmlObject, xmlOptionalText } from '../api/falabella-xml.js';
import { FALABELLA_SKU_LOOKUP_BATCH_SIZE, FalabellaParam } from '../falabella.constants.js';
import { FalabellaAction, FalabellaProductFilter } from '../falabella.enums.js';

const productsBodySchema = xmlObject({
  Products: xmlObject({
    Product: xmlList(
      z.object({
        SellerSku: z.string(),
        Url: xmlOptionalText.optional(),
        BusinessUnits: xmlObject({
          BusinessUnit: xmlList(
            z.object({ OperatorCode: z.string(), Stock: xmlOptionalText.optional() }),
          ).optional(),
        }).optional(),
      }),
    ).optional(),
  }).optional(),
});

/** What Falabella holds for one seller SKU in the connection's country. */
export interface FalabellaListedProduct {
  sellerSku: string;
  url: string | null;
  /** Its stock in the country; null when it is not sold there. */
  stock: number | null;
}

/** Reads products by seller SKU (`GetProducts`), a page of SKUs per call. Reads are not feeds. */
@Injectable()
export class FalabellaProductLookup {
  constructor(private readonly api: FalabellaApiClient) {}

  async find(
    account: FalabellaAccount,
    sellerSkus: readonly string[],
  ): Promise<Map<string, FalabellaListedProduct>> {
    const found = new Map<string, FalabellaListedProduct>();
    for (const batch of chunk([...new Set(sellerSkus)], FALABELLA_SKU_LOOKUP_BATCH_SIZE)) {
      for (const product of await this.read(account, batch)) {
        found.set(product.sellerSku, product);
      }
    }
    return found;
  }

  private async read(
    account: FalabellaAccount,
    sellerSkus: readonly string[],
  ): Promise<FalabellaListedProduct[]> {
    const { body } = await this.api.call(
      account,
      {
        action: FalabellaAction.GetProducts,
        params: {
          [FalabellaParam.Filter]: FalabellaProductFilter.All,
          [FalabellaParam.SkuSellerList]: JSON.stringify(sellerSkus),
        },
      },
      productsBodySchema,
    );
    return (body.Products?.Product ?? []).map((product) => {
      const units = product.BusinessUnits?.BusinessUnit ?? [];
      const unit = units.find((candidate) => candidate.OperatorCode === account.country);
      const stock = unit?.Stock ? Number(unit.Stock) : null;
      return {
        sellerSku: product.SellerSku,
        url: product.Url ?? null,
        stock: Number.isFinite(stock) ? stock : null,
      };
    });
  }
}
