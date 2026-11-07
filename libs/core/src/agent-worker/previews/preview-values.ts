import { formatCurrency } from '@crossmart/common';
import { AGENT_WORKER_PREVIEW_VALUE_MAX_LENGTH } from '../agent-worker.constants.js';
import type { AgentWorkerChange } from '../entities/agent-worker-views.js';
import { displayValue } from '../rules/action-outcome.js';
import { truncateWithNote } from '../rules/truncate-text.js';
import {
  DEFAULT_VARIANT_NAME,
  LIST_SEPARATOR,
  NONE,
  ON_STORE,
  OPTION_SEPARATOR,
  PRICE_LABEL,
} from './preview.constants.js';
import type { PreviewReader } from './preview-reader.js';

const CAMEL_CASE_BOUNDARY = /([a-z])([A-Z])/g;

/** A value as the card shows it: lists joined, empty lists as "none", long text cut. */
export function shown(value: unknown): string | null {
  if (Array.isArray(value) && value.length === 0) return NONE;
  const text = Array.isArray(value) ? value.map(String).join(LIST_SEPARATOR) : displayValue(value);
  return text === null ? null : truncateWithNote(text, AGENT_WORKER_PREVIEW_VALUE_MAX_LENGTH);
}

/** The change of one value, or nothing when it stays the same. */
export function change(label: string, before: unknown, after: unknown): AgentWorkerChange[] {
  const [from, to] = [shown(before), shown(after)];
  return from === to ? [] : [{ label, before: from, after: to }];
}

/** An exact decimal amount as money, such as "$19.00"; null stays null. */
export function money(amount: unknown, currencyCode: string): string | null {
  return typeof amount === 'string' ? formatCurrency(amount, currencyCode) : null;
}

/** "Price (Blue / Large)". */
export function priceLabel(variant: string): string {
  return `${PRICE_LABEL} (${variant})`;
}

/** A variant by its SKU, else its options. */
export function variantName(variant: { sku?: string | null; optionValues?: string[] }): string {
  if (variant.sku) return variant.sku;
  const options = variant.optionValues ?? [];
  return options.length > 0 ? options.join(OPTION_SEPARATOR) : DEFAULT_VARIANT_NAME;
}

/** "Linen Shirt on Outlet". */
export async function productOnStore(
  reader: PreviewReader,
  productId: string,
  connectionId: string,
): Promise<string> {
  const [product, store] = await Promise.all([
    reader.product(productId),
    reader.store(connectionId),
  ]);
  return `${product.title}${ON_STORE}${store.displayName}`;
}

/** A field name as words, for tools without a formatter: "inventoryBuffer" → "Inventory buffer". */
export function humanize(field: string): string {
  const words = field.replace(CAMEL_CASE_BOUNDARY, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
