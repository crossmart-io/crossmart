import { Injectable } from '@nestjs/common';
import type { ListingDraftVariant } from '../../sdk/capabilities/listing-publisher.js';
import {
  identifierAttributes,
  optionAttributes,
  productAttributes,
} from './mercadolibre-attributes.js';
import { MercadoLibreItemClient } from './mercadolibre-item.client.js';
import { MercadoLibreItemLifecycle } from './mercadolibre-item-lifecycle.js';
import {
  changedPictures,
  listedQuantity,
  listingPictures,
  mercadoLibreDescription,
  mercadoLibrePrice,
  mercadoLibreTitle,
  newItemTerms,
} from './mercadolibre-item.mapper.js';
import type { MercadoLibreItem, MercadoLibreItemInput } from './mercadolibre-item.types.js';
import { formatVariantKey } from './mercadolibre-keys.js';
import type {
  MercadoLibreListingOutcome,
  MercadoLibreListingPlan,
  MercadoLibreListingWriter,
} from './mercadolibre-listing-plan.js';
import { sharedPrice, toVariation, variationKeys } from './mercadolibre-variations.mapper.js';

function totalQuantity(plan: MercadoLibreListingPlan): number {
  return plan.draft.variants.reduce((total, variant) => total + listedQuantity(variant), 0);
}

function hasVariations(plan: MercadoLibreListingPlan): boolean {
  return plan.draft.variants.length > 1;
}

/** A single variant's own price, stock and attributes, on an item without variations. */
function singleVariantFields(
  plan: MercadoLibreListingPlan,
  variant: ListingDraftVariant,
): MercadoLibreItemInput {
  return {
    price: mercadoLibrePrice(variant.price, plan.settings),
    available_quantity: listedQuantity(variant),
    attributes: [
      ...productAttributes(plan.draft, plan.attributes),
      ...optionAttributes(plan.draft, variant, plan.attributes),
      ...identifierAttributes(variant),
    ],
  };
}

/** The price and stock of the item: its variations, or its only variant's. */
function stockFields(plan: MercadoLibreListingPlan): MercadoLibreItemInput {
  const [variant] = plan.draft.variants;
  if (!hasVariations(plan) && variant) return singleVariantFields(plan, variant);
  const price = sharedPrice(plan);
  return {
    price,
    available_quantity: totalQuantity(plan),
    attributes: productAttributes(plan.draft, plan.attributes),
    variations: plan.draft.variants.map((each) => toVariation(plan, each, price)),
  };
}

/**
 * Lists a product as one item, its variants as the item's variations (sellers without User
 * Products): `POST /items`, then its description. Updates edit the item in place; the title
 * changes only while it has no sales, as Mercado Libre allows.
 */
@Injectable()
export class MercadoLibreSingleItemWriter implements MercadoLibreListingWriter {
  constructor(
    private readonly items: MercadoLibreItemClient,
    private readonly lifecycle: MercadoLibreItemLifecycle,
  ) {}

  async publish(plan: MercadoLibreListingPlan): Promise<MercadoLibreListingOutcome> {
    const { accessToken, draft, settings, category } = plan;
    const created = await this.items.create(accessToken, {
      ...newItemTerms(draft, settings, category.id),
      title: mercadoLibreTitle(draft),
      pictures: listingPictures(draft),
      ...stockFields(plan),
    });
    await this.items.addDescription(accessToken, created.id, mercadoLibreDescription(draft));
    return this.outcome(plan, created);
  }

  async update(plan: MercadoLibreListingPlan, itemId: string): Promise<MercadoLibreListingOutcome> {
    const { accessToken, draft } = plan;
    const current = await this.lifecycle.requireOpen(accessToken, itemId);
    const updated = await this.items.update(accessToken, itemId, {
      ...(current.sold_quantity === 0 ? { title: mercadoLibreTitle(draft) } : {}),
      ...changedPictures(draft),
      ...stockFields(plan),
    });
    await this.items.replaceDescription(accessToken, itemId, mercadoLibreDescription(draft));
    return this.outcome(plan, updated);
  }

  private async outcome(
    plan: MercadoLibreListingPlan,
    item: MercadoLibreItem,
  ): Promise<MercadoLibreListingOutcome> {
    const { accessToken, draft } = plan;
    const active = await this.lifecycle.applyStatus(
      accessToken,
      item,
      draft.product.active,
      totalQuantity(plan),
    );
    const variants = hasVariations(plan)
      ? variationKeys(plan, item)
      : draft.variants.map(({ variantId }) => ({
          variantId,
          key: formatVariantKey({ itemId: item.id, variationId: null }),
        }));
    return { itemId: item.id, url: item.permalink ?? null, active, variants };
  }
}
