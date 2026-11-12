import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';
import { FALABELLA_MAX_IMAGES, HTTPS_PROTOCOL } from '../falabella.constants.js';
import { FalabellaField } from '../falabella.enums.js';

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === HTTPS_PROTOCOL;
  } catch {
    return false;
  }
}

/** The image links Falabella downloads: https only, the first 8, the first one main. */
export function falabellaImageUrls(urls: readonly string[]): string[] {
  return urls.filter(isHttps).slice(0, FALABELLA_MAX_IMAGES);
}

/** An `Image` request: every SKU gets the product's images, which replace any it had. */
export function imageRequest(
  draft: ListingDraft,
  sellerSkus: readonly string[],
): Record<string, unknown> {
  const images = falabellaImageUrls(draft.product.images.map((image) => image.url));
  return {
    [FalabellaField.ProductImage]: sellerSkus.map((sellerSku) => ({
      [FalabellaField.SellerSku]: sellerSku,
      [FalabellaField.Images]: { [FalabellaField.Image]: images },
    })),
  };
}
