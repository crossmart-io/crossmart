import { Injectable } from '@nestjs/common';
import type { ExternalProduct } from '@crossmart/connectors';
import { ListingRepository } from '../../repositories/listing.repository.js';
import type { ImportPageContext, ProductMatch } from '../entities/channel-import.js';
import { ProductMatchKind } from '../enums/product-match-kind.enum.js';
import {
  type CatalogMatchCandidate,
  CatalogMatchRepository,
} from '../repositories/catalog-match.repository.js';

interface KnownListing {
  productId: string;
  knownVariants: ReadonlyMap<string, string>;
}

/** Everything a page is matched against, read with a fixed number of queries. */
interface MatchIndex {
  listingByExternalId: Map<string, KnownListing>;
  productById: Map<string, CatalogMatchCandidate>;
  productByHandle: Map<string, CatalogMatchCandidate>;
  productBySku: Map<string, CatalogMatchCandidate>;
  /** Catalog products that already have a listing on the connection. */
  listedProductIds: ReadonlySet<string>;
}

function skusOf(product: ExternalProduct): string[] {
  return product.variants.flatMap((variant) => (variant.sku ? [variant.sku] : []));
}

function indexBySku(products: CatalogMatchCandidate[]): Map<string, CatalogMatchCandidate> {
  return new Map(
    products.flatMap((product) =>
      product.variants.flatMap((variant) => (variant.sku ? [[variant.sku, product] as const] : [])),
    ),
  );
}

/**
 * Decides, for each channel product of a page, whether it is already linked, belongs to a
 * catalog product with the same handle or SKU, or is new. A catalog product is linked to at
 * most one product of the account, so duplicates on the channel are reported, not merged.
 */
@Injectable()
export class ProductMatcher {
  constructor(
    private readonly listings: ListingRepository,
    private readonly catalog: CatalogMatchRepository,
  ) {}

  async match(context: ImportPageContext, products: ExternalProduct[]): Promise<ProductMatch[]> {
    const index = await this.loadIndex(context, products);
    const claimed = new Set<string>();
    return products.map((product) => this.classify(product, index, claimed));
  }

  private async loadIndex(
    { workspaceId, connectionId }: ImportPageContext,
    products: ExternalProduct[],
  ): Promise<MatchIndex> {
    const listings = await this.listings.findManyByExternalIds(
      connectionId,
      products.map((product) => product.externalId),
    );
    const [linked, byHandle, bySku] = await Promise.all([
      this.catalog.findByIds(
        workspaceId,
        listings.map((listing) => listing.productId),
      ),
      this.catalog.findByHandles(
        workspaceId,
        products.map((product) => product.handle),
      ),
      this.catalog.findBySkus(workspaceId, products.flatMap(skusOf)),
    ]);
    const listed = await this.listings.findExternalIdsByProduct(
      connectionId,
      [...byHandle, ...bySku].map((product) => product.id),
    );
    return {
      listingByExternalId: new Map(
        listings.map((listing) => [
          listing.externalId ?? '',
          {
            productId: listing.productId,
            knownVariants: new Map(listing.variants.map((row) => [row.externalId, row.variantId])),
          },
        ]),
      ),
      productById: new Map(linked.map((product) => [product.id, product])),
      productByHandle: new Map(byHandle.map((product) => [product.handle, product])),
      productBySku: indexBySku(bySku),
      listedProductIds: new Set(listed.keys()),
    };
  }

  private classify(
    product: ExternalProduct,
    index: MatchIndex,
    claimed: Set<string>,
  ): ProductMatch {
    const listing = index.listingByExternalId.get(product.externalId);
    const linkedTarget = listing ? index.productById.get(listing.productId) : undefined;
    if (listing && linkedTarget) {
      claimed.add(linkedTarget.id);
      return {
        product,
        kind: ProductMatchKind.Linked,
        target: linkedTarget,
        knownVariants: listing.knownVariants,
      };
    }
    const { kind, target } = this.findCandidate(product, index);
    if (!target) {
      return { product, kind };
    }
    if (claimed.has(target.id) || index.listedProductIds.has(target.id)) {
      return { product, kind: ProductMatchKind.Taken, target };
    }
    claimed.add(target.id);
    return { product, kind, target };
  }

  private findCandidate(
    product: ExternalProduct,
    index: MatchIndex,
  ): { kind: ProductMatchKind; target?: CatalogMatchCandidate } {
    const byHandle = index.productByHandle.get(product.handle);
    if (byHandle) {
      return { kind: ProductMatchKind.Handle, target: byHandle };
    }
    const sku = skusOf(product).find((candidate) => index.productBySku.has(candidate));
    const bySku = sku === undefined ? undefined : index.productBySku.get(sku);
    return bySku ? { kind: ProductMatchKind.Sku, target: bySku } : { kind: ProductMatchKind.New };
  }
}
