import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import { HTTP_STATUS_NO_CONTENT } from '../../sdk/http/http.constants.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import {
  EBAY_CATEGORY_PATH_SEPARATOR,
  EBAY_CATEGORY_SUGGESTIONS_SUFFIX,
  EBAY_CATEGORY_TREE_PATH,
  EBAY_DEFAULT_CATEGORY_TREE_PATH,
  EBAY_MARKETPLACE_ID_PARAM,
  EBAY_QUERY_PARAM,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import type { EbayMarketplaceId } from '../ebay-marketplace.js';
import type { EbayAccountContext } from '../api/ebay-account-context.js';

const categoryTreeSchema = z.object({ categoryTreeId: z.string().min(1) });

const suggestionsSchema = z.object({
  categorySuggestions: z
    .array(
      z.object({
        category: z.object({ categoryId: z.string().min(1), categoryName: z.string() }),
        categoryTreeNodeAncestors: z
          .array(z.object({ categoryName: z.string(), categoryTreeNodeLevel: z.number().int() }))
          .default([]),
      }),
    )
    .default([]),
});

type Suggestion = z.infer<typeof suggestionsSchema>['categorySuggestions'][number];

/** "Root > … > Leaf", from the ancestors eBay lists nearest first. */
function toCategory({ category, categoryTreeNodeAncestors }: Suggestion): ChannelCategory {
  const ancestors = [...categoryTreeNodeAncestors]
    .sort((left, right) => left.categoryTreeNodeLevel - right.categoryTreeNodeLevel)
    .map((ancestor) => ancestor.categoryName);
  return {
    id: category.categoryId,
    name: [...ancestors, category.categoryName].join(EBAY_CATEGORY_PATH_SEPARATOR),
  };
}

/**
 * Suggests leaf categories through the Taxonomy API, on the marketplace's default tree. The
 * tree id of each marketplace never changes, so it is read once per process.
 */
@Injectable()
export class EbayTaxonomyReader {
  private readonly treeIds = new Map<EbayMarketplaceId, string>();

  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
  ) {}

  /** Categories that fit `query`, best first; none for a blank query. */
  async suggest(account: EbayAccountContext, query: string): Promise<ChannelCategory[]> {
    const keywords = query.trim();
    if (!keywords) return [];
    const treeId = await this.treeId(account);
    const url = this.url(
      `${EBAY_CATEGORY_TREE_PATH}${encodeURIComponent(treeId)}${EBAY_CATEGORY_SUGGESTIONS_SUFFIX}`,
    );
    url.searchParams.set(EBAY_QUERY_PARAM, keywords);
    const response = await this.api.send(url, account.accessToken);
    if (response.status === HTTP_STATUS_NO_CONTENT) return [];
    const { categorySuggestions } = this.api.parse(response, suggestionsSchema);
    return categorySuggestions.map(toCategory);
  }

  private async treeId(account: EbayAccountContext): Promise<string> {
    const known = this.treeIds.get(account.marketplaceId);
    if (known) return known;
    const url = this.url(EBAY_DEFAULT_CATEGORY_TREE_PATH);
    url.searchParams.set(EBAY_MARKETPLACE_ID_PARAM, account.marketplaceId);
    const { categoryTreeId } = await this.api.get(url, account.accessToken, categoryTreeSchema);
    this.treeIds.set(account.marketplaceId, categoryTreeId);
    return categoryTreeId;
  }

  private url(path: string): URL {
    return new URL(path, this.app.hosts().api);
  }
}
