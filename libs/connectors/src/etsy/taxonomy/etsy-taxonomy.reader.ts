import { Injectable } from '@nestjs/common';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import { EtsyApiClient } from '../api/etsy-api.client.js';
import {
  ETSY_CATEGORY_PATH_SEPARATOR,
  ETSY_CATEGORY_SUGGESTIONS_MAX,
  ETSY_LEAF_NAME_WEIGHT,
  ETSY_QUERY_WORD_MIN_LENGTH,
  ETSY_SELLER_TAXONOMY_PATH,
  ETSY_TAXONOMY_CACHE_TTL_MS,
  QUERY_WORD_SPLITTER,
} from '../etsy.constants.js';
import { type EtsyTaxonomyNode, etsyTaxonomySchema } from './etsy-taxonomy.types.js';

/** A leaf category with its words, ready to match a query. */
interface LeafCategory {
  category: ChannelCategory;
  leafWords: ReadonlySet<string>;
  pathWords: ReadonlySet<string>;
}

const PLURAL_SUFFIX = 's';

interface CachedTaxonomy {
  leaves: LeafCategory[];
  expiresAt: number;
}

/** A word without its plural `s`, so "mug" finds "Mugs" and "mugs" finds "Mug". */
function singular(word: string): string {
  return word.length > ETSY_QUERY_WORD_MIN_LENGTH && word.endsWith(PLURAL_SUFFIX)
    ? word.slice(0, -PLURAL_SUFFIX.length)
    : word;
}

function wordsOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(QUERY_WORD_SPLITTER)
      .filter((word) => word.length >= ETSY_QUERY_WORD_MIN_LENGTH)
      .map(singular),
  );
}

/** Every leaf under `node`, named with its ancestors: "Home & Living > Kitchen > Mugs". */
function leavesOf(node: EtsyTaxonomyNode, ancestors: readonly string[]): LeafCategory[] {
  const path = [...ancestors, node.name];
  if (node.children.length > 0) {
    return node.children.flatMap((child) => leavesOf(child, path));
  }
  return [
    {
      category: { id: String(node.id), name: path.join(ETSY_CATEGORY_PATH_SEPARATOR) },
      leafWords: wordsOf(node.name),
      pathWords: wordsOf(ancestors.join(' ')),
    },
  ];
}

/** How well a leaf fits the query words: its own name counts more than its ancestors'. */
function scoreOf(leaf: LeafCategory, queryWords: ReadonlySet<string>): number {
  let score = 0;
  for (const word of queryWords) {
    if (leaf.leafWords.has(word)) score += ETSY_LEAF_NAME_WEIGHT;
    else if (leaf.pathWords.has(word)) score += 1;
  }
  return score;
}

/**
 * Etsy's seller taxonomy, the categories listings go in. Etsy has no suggestion endpoint, so
 * categories are matched to the query by the words of their names, best first. Each process
 * keeps the taxonomy for six hours.
 */
@Injectable()
export class EtsyTaxonomyReader {
  private cached: CachedTaxonomy | null = null;

  constructor(private readonly api: EtsyApiClient) {}

  async suggest(accessToken: string, query: string, now = Date.now()): Promise<ChannelCategory[]> {
    const queryWords = wordsOf(query);
    const leaves = await this.leaves(accessToken, now);
    return leaves
      .map((leaf) => ({ leaf, score: scoreOf(leaf, queryWords) }))
      .filter(({ score }) => score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, ETSY_CATEGORY_SUGGESTIONS_MAX)
      .map(({ leaf }) => leaf.category);
  }

  private async leaves(accessToken: string, now: number): Promise<LeafCategory[]> {
    if (this.cached && this.cached.expiresAt > now) return this.cached.leaves;
    const { results } = await this.api.get(
      { path: ETSY_SELLER_TAXONOMY_PATH, accessToken },
      etsyTaxonomySchema,
    );
    const leaves = results.flatMap((node) => leavesOf(node, []));
    this.cached = { leaves, expiresAt: now + ETSY_TAXONOMY_CACHE_TTL_MS };
    return leaves;
  }
}
