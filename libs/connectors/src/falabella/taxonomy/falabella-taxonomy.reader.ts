import { Injectable } from '@nestjs/common';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import type { FalabellaAccount } from '../api/falabella-account.js';
import { FalabellaApiClient } from '../api/falabella-api.client.js';
import { FALABELLA_CATEGORY_SUGGESTIONS, FalabellaParam } from '../falabella.constants.js';
import { FalabellaAction, type FalabellaCountry } from '../falabella.enums.js';
import type { FalabellaAttribute } from './falabella-attribute.js';
import { categoryAttributes } from './falabella-attributes.js';
import { leafCategories, matchCategories } from './falabella-category-match.js';
import {
  categoryAttributesBodySchema,
  categorySuggestionBodySchema,
  categoryTreeBodySchema,
} from './falabella-taxonomy.types.js';

/**
 * Falabella's categories and their attributes. The tree is read once per country and process;
 * suggestions put Falabella's own pick for a title first, then the leaves whose names share
 * its words.
 */
@Injectable()
export class FalabellaTaxonomyReader {
  private readonly trees = new Map<FalabellaCountry, Promise<ChannelCategory[]>>();

  constructor(private readonly api: FalabellaApiClient) {}

  async suggest(account: FalabellaAccount, query: string): Promise<ChannelCategory[]> {
    const [leaves, suggestedId] = await Promise.all([
      this.leaves(account),
      this.suggestedId(account, query),
    ]);
    const suggested = leaves.filter((leaf) => leaf.id === suggestedId);
    const matches = matchCategories(leaves, query, FALABELLA_CATEGORY_SUGGESTIONS).filter(
      (leaf) => leaf.id !== suggestedId,
    );
    return [...suggested, ...matches].slice(0, FALABELLA_CATEGORY_SUGGESTIONS);
  }

  /** The category's attributes, with the ones every product takes. */
  async attributes(account: FalabellaAccount, categoryId: string): Promise<FalabellaAttribute[]> {
    const { body } = await this.api.call(
      account,
      {
        action: FalabellaAction.GetCategoryAttributes,
        params: { [FalabellaParam.PrimaryCategory]: categoryId },
      },
      categoryAttributesBodySchema,
    );
    return categoryAttributes(body.Attribute ?? [], account.country);
  }

  /** Falabella's suggestion is optional help: when it fails, the word match still answers. */
  private async suggestedId(account: FalabellaAccount, query: string): Promise<string | null> {
    try {
      const { body } = await this.api.call(
        account,
        { action: FalabellaAction.GetCategorySuggestion, params: { [FalabellaParam.Name]: query } },
        categorySuggestionBodySchema,
      );
      return body.SuggestedCategory?.CategoryId ?? null;
    } catch {
      return null;
    }
  }

  private leaves(account: FalabellaAccount): Promise<ChannelCategory[]> {
    const cached = this.trees.get(account.country);
    if (cached) return cached;
    const read = this.readLeaves(account);
    this.trees.set(account.country, read);
    read.catch(() => this.trees.delete(account.country));
    return read;
  }

  private async readLeaves(account: FalabellaAccount): Promise<ChannelCategory[]> {
    const { body } = await this.api.call(
      account,
      { action: FalabellaAction.GetCategoryTree },
      categoryTreeBodySchema,
    );
    return leafCategories(body.Categories.Category);
  }
}
