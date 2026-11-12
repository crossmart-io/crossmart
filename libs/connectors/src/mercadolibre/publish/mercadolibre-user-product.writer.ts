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
import { parseVariantKey } from './mercadolibre-keys.js';
import type {
  MercadoLibreListingOutcome,
  MercadoLibreListingPlan,
  MercadoLibreListingWriter,
} from './mercadolibre-listing-plan.js';

/** One variant written: its item, and whether that item is active. */
interface WrittenVariant {
  variantId: string;
  item: MercadoLibreItem;
  active: boolean;
}

/** What every write of a variant's item sends: its price, stock and attributes. */
function variantFields(
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

function existingItemId(variant: ListingDraftVariant): string | null {
  const key = variant.externalVariantId ? parseVariantKey(variant.externalVariantId) : null;
  return key?.variationId === null ? key.itemId : null;
}

/**
 * Lists a product under User Products ("Precio por variación"): one item per variant, each
 * with its own price, grouped by a shared `family_name` and the variant's option attributes.
 * Mercado Libre writes the titles. A publish that fails part way closes the items it created.
 */
@Injectable()
export class MercadoLibreUserProductWriter implements MercadoLibreListingWriter {
  constructor(
    private readonly items: MercadoLibreItemClient,
    private readonly lifecycle: MercadoLibreItemLifecycle,
  ) {}

  async publish(plan: MercadoLibreListingPlan): Promise<MercadoLibreListingOutcome> {
    const familyName = mercadoLibreTitle(plan.draft);
    const written: WrittenVariant[] = [];
    try {
      for (const variant of plan.draft.variants) {
        written.push(await this.create(plan, variant, familyName));
      }
    } catch (error) {
      const createdIds = written.map(({ item }) => item.id);
      await this.lifecycle.close(plan.accessToken, createdIds).catch(() => undefined);
      throw error;
    }
    return outcomeOf(written);
  }

  async update(plan: MercadoLibreListingPlan, itemId: string): Promise<MercadoLibreListingOutcome> {
    const listingItem = await this.lifecycle.requireOpen(plan.accessToken, itemId);
    const familyName = listingItem.family_name ?? mercadoLibreTitle(plan.draft);
    const written: WrittenVariant[] = [];
    for (const variant of plan.draft.variants) {
      const existing = existingItemId(variant);
      written.push(
        existing
          ? await this.edit(plan, variant, existing)
          : await this.create(plan, variant, familyName),
      );
    }
    return outcomeOf(written);
  }

  private async create(
    plan: MercadoLibreListingPlan,
    variant: ListingDraftVariant,
    familyName: string,
  ): Promise<WrittenVariant> {
    const { accessToken, draft, settings, category } = plan;
    const item = await this.items.create(accessToken, {
      ...newItemTerms(draft, settings, category.id),
      family_name: familyName,
      pictures: listingPictures(draft),
      ...variantFields(plan, variant),
    });
    await this.items.addDescription(accessToken, item.id, mercadoLibreDescription(draft));
    return this.withStatus(plan, variant, item);
  }

  private async edit(
    plan: MercadoLibreListingPlan,
    variant: ListingDraftVariant,
    itemId: string,
  ): Promise<WrittenVariant> {
    const { accessToken, draft } = plan;
    await this.lifecycle.requireOpen(accessToken, itemId);
    const item = await this.items.update(accessToken, itemId, {
      ...changedPictures(draft),
      ...variantFields(plan, variant),
    });
    await this.items.replaceDescription(accessToken, itemId, mercadoLibreDescription(draft));
    return this.withStatus(plan, variant, item);
  }

  private async withStatus(
    plan: MercadoLibreListingPlan,
    variant: ListingDraftVariant,
    item: MercadoLibreItem,
  ): Promise<WrittenVariant> {
    const wantsActive = plan.draft.product.active;
    const active = await this.lifecycle.applyStatus(
      plan.accessToken,
      item,
      wantsActive,
      listedQuantity(variant),
    );
    return { variantId: variant.variantId, item, active };
  }
}

/** The listing is its first variant's item, and active while any variant's item is. */
function outcomeOf(written: readonly WrittenVariant[]): MercadoLibreListingOutcome {
  const [first] = written;
  return {
    itemId: first?.item.id ?? '',
    url: first?.item.permalink ?? null,
    active: written.some(({ active }) => active),
    variants: written.map(({ variantId, item }) => ({ variantId, key: item.id })),
  };
}
