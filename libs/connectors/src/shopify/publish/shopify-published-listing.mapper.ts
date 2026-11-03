import type { ListingDraft, PublishedListing } from '../../sdk/capabilities/listing-publisher.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { type ProductSetData, ShopifyProductStatus } from '../graphql/product-set.mutation.js';
import { shopOrigin } from '../shop-domain.js';
import { SHOPIFY_ADMIN_PRODUCT_PATH, SHOPIFY_FIRST_POSITION } from '../shopify.constants.js';

type SetProduct = NonNullable<ProductSetData['productSet']['product']>;

const GID_SEPARATOR = '/';
const MISSING_VARIANT = 'Shopify did not return every variant it was sent';

/** The product's storefront URL, or its admin page while it is not on the online store. */
function productUrl(product: SetProduct, shopDomain: string): string {
  if (product.onlineStoreUrl) return product.onlineStoreUrl;
  const numericId = product.id.split(GID_SEPARATOR).at(-1) ?? '';
  return new URL(`${SHOPIFY_ADMIN_PRODUCT_PATH}${numericId}`, shopOrigin(shopDomain)).toString();
}

/** Matches Shopify's variants back to the draft's by position, which the input set. */
export function toPublishedListing(
  draft: ListingDraft,
  product: SetProduct,
  shopDomain: string,
): PublishedListing {
  const byPosition = new Map(product.variants.nodes.map((node) => [node.position, node]));
  const variants = draft.variants.map((variant, index) => {
    const node = byPosition.get(index + SHOPIFY_FIRST_POSITION);
    if (!node) {
      throw new ChannelError(
        ChannelType.Shopify,
        ChannelErrorCode.ChannelUnavailable,
        MISSING_VARIANT,
      );
    }
    return {
      variantId: variant.variantId,
      externalId: node.id,
      externalInventoryId: node.inventoryItem?.id ?? null,
    };
  });
  return {
    externalId: product.id,
    externalUrl: productUrl(product, shopDomain),
    active: product.status === ShopifyProductStatus.Active,
    variants,
  };
}
