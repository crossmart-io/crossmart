/** The image choice a listing may override. */
export interface ImageOverride {
  mediaOverridden: boolean;
  mediaUrls: readonly string[];
}

/**
 * The image URLs a listing shows: the product's, or the subset the store override chose, in its
 * order. URLs the product no longer has are dropped, as publishing drops them.
 */
export function effectiveImageUrls(
  productUrls: readonly string[],
  override: ImageOverride | null,
): string[] {
  if (!override?.mediaOverridden) return [...productUrls];
  const known = new Set(productUrls);
  return override.mediaUrls.filter((url) => known.has(url));
}
