import type { FixedDecimal } from '@crossmart/common';
import { ETSY_THREE_VARIATIONS, ETSY_TWO_VARIATIONS } from '../etsy.constants.js';
import type {
  EtsyInventory,
  EtsyInventoryInput,
  EtsyInventoryProduct,
  EtsyInventoryPropertyValue,
  EtsyProductInput,
  EtsyPropertyValueInput,
} from './etsy-listing.types.js';
import { etsyMoneyToDecimal, toEtsyPrice } from './etsy-money.js';

/** What setting one SKU's value did. */
export enum InventoryEditOutcome {
  Changed = 'changed',
  Unchanged = 'unchanged',
  /** The listing has no product with the SKU. */
  Missing = 'missing',
}

function toPropertyValueInput(value: EtsyInventoryPropertyValue): EtsyPropertyValueInput {
  return {
    property_id: value.property_id,
    ...(value.property_name ? { property_name: value.property_name } : {}),
    ...(value.scale_id ? { scale_id: value.scale_id } : {}),
    value_ids: value.value_ids,
    values: value.values,
  };
}

/** A product as `updateListingInventory` takes it: read-only fields and deleted offerings dropped. */
function toProductInput(product: EtsyInventoryProduct): EtsyProductInput {
  return {
    sku: product.sku ?? '',
    property_values: product.property_values.map(toPropertyValueInput),
    offerings: product.offerings
      .filter((offering) => !offering.is_deleted)
      .map((offering) => ({
        price: toEtsyPrice(etsyMoneyToDecimal(offering.price)),
        quantity: offering.quantity,
        is_enabled: offering.is_enabled,
        readiness_state_id: offering.readiness_state_id ?? null,
      })),
  };
}

/**
 * A listing's inventory as Etsy holds it, changed SKU by SKU. Etsy replaces the whole
 * inventory on every write, so stock and price changes read it, change what they must, and
 * send all of it back, with the property and value ids Etsy gave.
 */
export class EtsyInventoryEdit {
  private changed = false;

  private constructor(private readonly input: EtsyInventoryInput) {}

  static of(inventory: EtsyInventory): EtsyInventoryEdit {
    return new EtsyInventoryEdit({
      products: inventory.products.filter((product) => !product.is_deleted).map(toProductInput),
      price_on_property: inventory.price_on_property,
      quantity_on_property: inventory.quantity_on_property,
      sku_on_property: inventory.sku_on_property,
      readiness_state_on_property: inventory.readiness_state_on_property ?? [],
    });
  }

  get hasChanges(): boolean {
    return this.changed;
  }

  get body(): EtsyInventoryInput {
    return this.input;
  }

  /** `max_variations_supported`, when a product varies by three properties. */
  get maxVariations(): string | null {
    const most = Math.max(
      0,
      ...this.input.products.map((product) => product.property_values.length),
    );
    return most > ETSY_TWO_VARIATIONS ? ETSY_THREE_VARIATIONS : null;
  }

  setQuantity(sku: string, quantity: number): InventoryEditOutcome {
    return this.edit(sku, (offering) => {
      if (offering.quantity === quantity) return false;
      offering.quantity = quantity;
      return true;
    });
  }

  setPrice(sku: string, price: FixedDecimal): InventoryEditOutcome {
    const amount = toEtsyPrice(price);
    return this.edit(sku, (offering) => {
      if (offering.price === amount) return false;
      offering.price = amount;
      return true;
    });
  }

  private edit(
    sku: string,
    change: (offering: EtsyProductInput['offerings'][number]) => boolean,
  ): InventoryEditOutcome {
    const product = this.input.products.find((candidate) => candidate.sku === sku);
    if (!product || product.offerings.length === 0) return InventoryEditOutcome.Missing;
    const results = product.offerings.map(change);
    const changed = results.some(Boolean);
    this.changed ||= changed;
    return changed ? InventoryEditOutcome.Changed : InventoryEditOutcome.Unchanged;
  }
}
