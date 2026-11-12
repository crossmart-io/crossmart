import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import {
  CATEGORY_MATCH_MIN_WORD_LENGTH,
  CATEGORY_PATH_SEPARATOR,
  WORD_SPLIT_PATTERN,
} from '../falabella.constants.js';
import type { FalabellaCategoryNode } from './falabella-taxonomy.types.js';

/** Every leaf of the tree, named with its ancestors: `Calzado > Zapatillas > Running`. */
export function leafCategories(
  nodes: readonly FalabellaCategoryNode[],
  ancestors: readonly string[] = [],
): ChannelCategory[] {
  return nodes.flatMap((node) => {
    const path = [...ancestors, node.Name];
    const children = node.Children?.Category ?? [];
    return children.length > 0
      ? leafCategories(children, path)
      : [{ id: node.CategoryId, name: path.join(CATEGORY_PATH_SEPARATOR) }];
  });
}

/** Lower-cased words without accents, long enough to mean something. */
function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(WORD_SPLIT_PATTERN)
    .filter((word) => word.length >= CATEGORY_MATCH_MIN_WORD_LENGTH);
}

/** How many of the query's words the category's path holds; a word's plural counts. */
function score(category: ChannelCategory, queryWords: readonly string[]): number {
  const pathWords = words(category.name);
  return queryWords.filter((word) =>
    pathWords.some((pathWord) => pathWord.startsWith(word) || word.startsWith(pathWord)),
  ).length;
}

/** The leaves whose path shares most words with `query`, best first. */
export function matchCategories(
  leaves: readonly ChannelCategory[],
  query: string,
  limit: number,
): ChannelCategory[] {
  const queryWords = words(query);
  return leaves
    .map((category) => ({ category, score: score(category, queryWords) }))
    .filter((match) => match.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit)
    .map((match) => match.category);
}
