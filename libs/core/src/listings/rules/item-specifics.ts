import type { ItemSpecific } from '@crossmart/connectors';

/** Names match without regard to case or surrounding spaces, as channels match them. */
export function itemSpecificKey(name: string): string {
  return name.trim().toLowerCase();
}

function distinctValues(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/**
 * Item specifics as they are stored: trimmed, without blank or repeated values, and without
 * specifics left with no value (clearing every value removes the specific).
 */
export function normalizeItemSpecifics(specifics: readonly ItemSpecific[]): ItemSpecific[] {
  return specifics
    .map(({ name, values }) => ({ name: name.trim(), values: distinctValues(values) }))
    .filter((specific) => specific.name && specific.values.length > 0);
}

/** The names given more than once, which a listing cannot hold. */
export function repeatedItemSpecificNames(specifics: readonly ItemSpecific[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const { name } of specifics) {
    const key = itemSpecificKey(name);
    if (seen.has(key)) repeated.add(name);
    seen.add(key);
  }
  return [...repeated];
}
