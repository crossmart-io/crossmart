import { Injectable } from '@nestjs/common';
import { SortDirection } from '@crossmart/common';
import { ProductSort } from '../../catalog/enums/product-store-filter.enum.js';
import { ProductsService } from '../../catalog/services/products.service.js';
import { ProductChannelsService } from '../../listings/services/product-channels.service.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { ASK_LOOKUP_PRODUCTS_LIMIT } from '../ask.constants.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { productListingFacts } from '../rules/account-facts.js';
import { ACCOUNT_PAGES, AccountFactPages } from './account-fact-pages.js';
import { AccountLookup } from './account-lookup.js';

/** Where products matching a SKU or title stand on each store, with their last error. */
@Injectable()
export class ListingStatusLookup extends AccountLookup {
  readonly kind = AccountLookupKind.ListingStatus;
  readonly permissions = [WorkspacePermission.ViewProducts, WorkspacePermission.ViewChannels];

  constructor(
    private readonly products: ProductsService,
    private readonly productChannels: ProductChannelsService,
    private readonly pages: AccountFactPages,
  ) {
    super();
  }

  async run(workspaceId: string, query: string | null): Promise<KnowledgeChunk[]> {
    if (!query) return [];
    const { items } = await this.products.list(workspaceId, {
      search: query,
      sort: ProductSort.Updated,
      direction: SortDirection.Desc,
      limit: ASK_LOOKUP_PRODUCTS_LIMIT,
    });
    return Promise.all(
      items.map(async (product) =>
        this.pages.chunk({
          id: `${this.kind}:${product.id}`,
          title: `Listing status of "${product.title}"`,
          path: `${ACCOUNT_PAGES.product}${product.id}`,
          text: productListingFacts(
            product,
            await this.productChannels.list(workspaceId, product.id),
          ),
        }),
      ),
    );
  }
}
