/** One variant of a product in a workspace. */
export interface VariantRef {
  workspaceId: string;
  productId: string;
  variantId: string;
}

/** A partial edit of a variant's prices: only the fields given change. */
export interface VariantPricePatch {
  /** Exact decimal string, such as "19.90". */
  price?: string;
  /** The "was" price buyers see struck through; null removes it. */
  compareAtPrice?: string | null;
}
