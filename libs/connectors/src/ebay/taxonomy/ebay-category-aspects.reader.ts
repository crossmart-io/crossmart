import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  type CategoryAspect,
  CategoryAspectMode,
  CategoryAspectUsage,
} from '../../sdk/capabilities/taxonomy-provider.js';
import { HTTP_STATUS_NO_CONTENT } from '../../sdk/http/http.constants.js';
import type { EbayAccountContext } from '../api/ebay-account-context.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import {
  EBAY_ASPECT_VALUES_MAX,
  EBAY_ASPECTS_CACHE_TTL_MS,
  EBAY_CATEGORY_ID_PARAM,
  EBAY_ITEM_ASPECTS_SUFFIX,
} from '../ebay.constants.js';
import { EbayAspectCardinality, EbayAspectMode, EbayAspectUsage } from './ebay-aspect.enums.js';
import { EbayTaxonomyReader } from './ebay-taxonomy.reader.js';

/** eBay may add constraint values; unknown ones read as the most permissive known one. */
const aspectsSchema = z.object({
  aspects: z
    .array(
      z.object({
        localizedAspectName: z.string().min(1),
        aspectConstraint: z.object({
          aspectRequired: z.boolean().default(false),
          aspectUsage: z.enum(EbayAspectUsage).catch(EbayAspectUsage.Optional),
          aspectMode: z.enum(EbayAspectMode).catch(EbayAspectMode.FreeText),
          itemToAspectCardinality: z
            .enum(EbayAspectCardinality)
            .catch(EbayAspectCardinality.Single),
        }),
        aspectValues: z.array(z.object({ localizedValue: z.string() })).default([]),
      }),
    )
    .default([]),
});

type EbayAspect = z.infer<typeof aspectsSchema>['aspects'][number];

const USAGES: Readonly<Record<EbayAspectUsage, CategoryAspectUsage>> = {
  [EbayAspectUsage.Recommended]: CategoryAspectUsage.Recommended,
  [EbayAspectUsage.Optional]: CategoryAspectUsage.Optional,
};

const MODES: Readonly<Record<EbayAspectMode, CategoryAspectMode>> = {
  [EbayAspectMode.FreeText]: CategoryAspectMode.FreeText,
  [EbayAspectMode.SelectionOnly]: CategoryAspectMode.SelectionOnly,
};

interface CachedAspects {
  aspects: CategoryAspect[];
  expiresAt: number;
}

function toCategoryAspect({
  localizedAspectName,
  aspectConstraint,
  aspectValues,
}: EbayAspect): CategoryAspect {
  return {
    name: localizedAspectName,
    required: aspectConstraint.aspectRequired,
    usage: USAGES[aspectConstraint.aspectUsage],
    mode: MODES[aspectConstraint.aspectMode],
    multiple: aspectConstraint.itemToAspectCardinality === EbayAspectCardinality.Multi,
    values: aspectValues.slice(0, EBAY_ASPECT_VALUES_MAX).map((value) => value.localizedValue),
  };
}

/** Where each kind of aspect is listed: required first, then recommended, then optional. */
enum AspectRank {
  Required,
  Recommended,
  Optional,
}

/** eBay's order is kept within each rank. */
function rank(aspect: CategoryAspect): AspectRank {
  if (aspect.required) return AspectRank.Required;
  return aspect.usage === CategoryAspectUsage.Recommended
    ? AspectRank.Recommended
    : AspectRank.Optional;
}

/**
 * Reads the item specifics of a leaf category through the Taxonomy API
 * (`get_item_aspects_for_category`), trimmed to what the editor and the publisher need. Each
 * tree and category is read at most once per `EBAY_ASPECTS_CACHE_TTL_MS` per process.
 */
@Injectable()
export class EbayCategoryAspectsReader {
  private readonly cache = new Map<string, CachedAspects>();

  constructor(
    private readonly taxonomy: EbayTaxonomyReader,
    private readonly api: EbayApiClient,
  ) {}

  async read(account: EbayAccountContext, categoryId: string): Promise<CategoryAspect[]> {
    const url = await this.taxonomy.treeUrl(account, EBAY_ITEM_ASPECTS_SUFFIX);
    url.searchParams.set(EBAY_CATEGORY_ID_PARAM, categoryId);
    const key = url.toString();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.aspects;
    const aspects = await this.fetch(url, account.accessToken);
    this.cache.set(key, { aspects, expiresAt: Date.now() + EBAY_ASPECTS_CACHE_TTL_MS });
    return aspects;
  }

  private async fetch(url: URL, accessToken: string): Promise<CategoryAspect[]> {
    const response = await this.api.send(url, accessToken);
    if (response.status === HTTP_STATUS_NO_CONTENT) return [];
    const { aspects } = this.api.parse(response, aspectsSchema);
    return aspects.map(toCategoryAspect).sort((left, right) => rank(left) - rank(right));
  }
}
