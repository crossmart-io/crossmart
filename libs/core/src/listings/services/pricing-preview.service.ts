import { Injectable } from '@nestjs/common';
import type { PricingRule } from '../../channels/entities/pricing-rule.js';
import type { PricingPreview } from '../entities/pricing-preview.js';
import { variantTitle } from '../rules/variant-title.js';
import { ChannelPriceResolver } from './channel-price-resolver.js';
import { ProductSelectionService } from './product-selection.service.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';
import { SyncProductLoader } from './sync-product.loader.js';

/**
 * Applies a pricing rule, saved or not, to a real product of the catalog, so the merchant
 * sees its effect while editing it. Without a product, the first selected one is used.
 */
@Injectable()
export class PricingPreviewService {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly products: SyncProductLoader,
    private readonly selection: ProductSelectionService,
    private readonly prices: ChannelPriceResolver,
  ) {}

  async preview(
    workspaceId: string,
    connectionId: string,
    rule: PricingRule | null,
    productId?: string,
  ): Promise<PricingPreview> {
    const connection = await this.connections.require(workspaceId, connectionId);
    const { currencyCode } = connection.pricing;
    const exampleId =
      productId ??
      (await this.selection.firstSelectedId(
        workspaceId,
        connection.view.settings.productSelection,
      ));
    const product = exampleId ? await this.products.find(workspaceId, exampleId) : null;
    if (!product) {
      return { currencyCode, product: null, variants: [] };
    }
    return {
      currencyCode,
      product: { id: product.id, title: product.title },
      variants: product.variants.map((variant) => ({
        variantId: variant.id,
        title: variantTitle(variant),
        basePrice: variant.price,
        cost: variant.cost,
        resolved: this.prices.resolve(variant, { rule, currencyCode }),
      })),
    };
  }
}
