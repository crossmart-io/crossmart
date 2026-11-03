import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type { CatalogSource } from '../../sdk/capabilities/catalog-source.js';
import type { ChannelPage, ExternalProduct } from '../../sdk/capabilities/catalog.types.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  CATALOG_PRODUCTS_QUERY,
  type ShopifyCatalogProduct,
} from '../graphql/catalog-products.query.js';
import type { ShopifyCatalogVariant } from '../graphql/catalog-variant.fragment.js';
import { PRIMARY_LOCATION_QUERY } from '../graphql/primary-location.query.js';
import { PRODUCT_VARIANTS_QUERY } from '../graphql/product-variants.query.js';
import { ShopifyAdminClient } from '../graphql/shopify-admin.client.js';
import {
  SHOPIFY_CATALOG_FIRST_VARIANTS,
  SHOPIFY_CATALOG_MEDIA_PER_PRODUCT,
  SHOPIFY_CATALOG_PAGE_SIZE,
  SHOPIFY_VARIANT_PAGE_SIZE,
} from '../shopify.constants.js';
import { toExternalProduct } from './shopify-catalog.mapper.js';

const NO_LOCATION = 'The Shopify store has no location to read stock from';
const PRODUCT_GONE = 'A Shopify product was deleted while it was being read. Try again.';

/**
 * Reads a store's catalog page by page with the Admin GraphQL API.
 *
 * Cursor pages rather than a bulk operation: an import writes each page before it reads the
 * next and stores the cursor, so a stopped import resumes where it was, and the first products
 * appear within seconds. A bulk operation returns the whole catalog as one JSONL file only once
 * it has finished, which suits catalogs of hundreds of thousands of products better than the
 * sellers Crossmart serves, and it needs its own polling and download states. The cost budget
 * is respected through small pages (see `SHOPIFY_CATALOG_PAGE_SIZE`) and the client's throttle
 * handling; imports run on the lowest-priority queue, so waiting for the bucket is acceptable.
 */
@Injectable()
export class ShopifyCatalogReader implements CatalogSource {
  constructor(private readonly admin: ShopifyAdminClient) {}

  async fetchProducts(
    session: ChannelSession,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalProduct>> {
    const locationId = await this.primaryLocationId(session);
    const { products, productsCount } = await this.admin.request(session, CATALOG_PRODUCTS_QUERY, {
      first: SHOPIFY_CATALOG_PAGE_SIZE,
      after: cursor,
      variantsFirst: SHOPIFY_CATALOG_FIRST_VARIANTS,
      mediaFirst: SHOPIFY_CATALOG_MEDIA_PER_PRODUCT,
      locationId,
    });
    const items: ExternalProduct[] = [];
    for (const product of products.nodes) {
      const variants = await this.allVariants(session, product, locationId);
      items.push(toExternalProduct(product, variants));
    }
    return {
      items,
      nextCursor: products.pageInfo.hasNextPage ? products.pageInfo.endCursor : null,
      totalCount: productsCount?.count ?? null,
    };
  }

  private async primaryLocationId(session: ChannelSession): Promise<string> {
    const { location } = await this.admin.request(session, PRIMARY_LOCATION_QUERY);
    if (!location) {
      throw new ChannelError(ChannelType.Shopify, ChannelErrorCode.RequestRejected, NO_LOCATION);
    }
    return location.id;
  }

  /** The first variants came with the product; the rest are read in larger pages. */
  private async allVariants(
    session: ChannelSession,
    product: ShopifyCatalogProduct,
    locationId: string,
  ): Promise<ShopifyCatalogVariant[]> {
    const variants = [...product.variants.nodes];
    let pageInfo = product.variants.pageInfo;
    while (pageInfo.hasNextPage && pageInfo.endCursor) {
      const data = await this.admin.request(session, PRODUCT_VARIANTS_QUERY, {
        productId: product.id,
        first: SHOPIFY_VARIANT_PAGE_SIZE,
        after: pageInfo.endCursor,
        locationId,
      });
      if (!data.product) {
        throw new ChannelError(
          ChannelType.Shopify,
          ChannelErrorCode.ChannelUnavailable,
          PRODUCT_GONE,
        );
      }
      variants.push(...data.product.variants.nodes);
      pageInfo = data.product.variants.pageInfo;
    }
    return variants;
  }
}
