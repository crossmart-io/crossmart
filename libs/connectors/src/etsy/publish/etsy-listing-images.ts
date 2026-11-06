import { Injectable } from '@nestjs/common';
import { truncate } from '@crossmart/common';
import type { ExternalImage } from '../../sdk/capabilities/catalog.types.js';
import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  type FetchedImage,
  ImageFetcher,
  ImageFetchError,
} from '../../sdk/images/image-fetcher.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import type { EtsyShopContext } from '../api/etsy-shop-context.js';
import { ETSY_IMAGE_ALT_TEXT_MAX_LENGTH, ETSY_IMAGE_MAX_COUNT } from '../etsy.constants.js';
import { etsyError } from '../etsy-errors.js';
import { EtsyImageClient } from './etsy-image.client.js';

const HTTPS_PROTOCOL = 'https:';
const FIRST_RANK = 1;
const UNREACHABLE_IMAGE =
  'Crossmart could not download an image of this product; it will try again';

/** Whether Crossmart downloads an image link: only `https` ones. */
export function isHttpsImage(url: string): boolean {
  return URL.canParse(url) && new URL(url).protocol === HTTPS_PROTOCOL;
}

/** The images a listing gets: the product's `https` images, the first 20. */
export function listingImages(draft: ListingDraft): ExternalImage[] {
  return draft.product.images.filter(({ url }) => isHttpsImage(url)).slice(0, ETSY_IMAGE_MAX_COUNT);
}

function unusableImage(position: number, error: ImageFetchError): ChannelError {
  return new ChannelError(
    ChannelType.Etsy,
    ChannelErrorCode.RequestRejected,
    `Crossmart could not download image ${position} of this product for Etsy (${error.failure}). ` +
      'Use a public https link to an image file.',
    PublishRequirement.Images,
  );
}

/**
 * Puts a product's images on its Etsy listing. Etsy takes image files, not links, so each is
 * downloaded (`ImageFetcher` refuses private addresses) and uploaded at its position,
 * replacing the image there; images past the product's last are deleted.
 */
@Injectable()
export class EtsyListingImages {
  constructor(
    private readonly images: EtsyImageClient,
    private readonly fetcher: ImageFetcher,
  ) {}

  async sync(shop: EtsyShopContext, listingId: string, draft: ListingDraft): Promise<void> {
    const wanted = listingImages(draft);
    const existing = await this.images.list(shop, listingId);
    for (const [index, image] of wanted.entries()) {
      const rank = index + FIRST_RANK;
      await this.images.upload(shop, listingId, {
        image: await this.download(image.url, rank),
        rank,
        altText: image.altText ? truncate(image.altText, ETSY_IMAGE_ALT_TEXT_MAX_LENGTH) : null,
      });
    }
    for (const stale of existing.filter(({ rank }) => rank > wanted.length)) {
      await this.images.delete(shop, listingId, stale.imageId);
    }
  }

  private async download(url: string, position: number): Promise<FetchedImage> {
    try {
      return await this.fetcher.fetch(url);
    } catch (error) {
      if (error instanceof ImageFetchError && !error.retryable) {
        throw unusableImage(position, error);
      }
      throw etsyError(ChannelErrorCode.ChannelUnavailable, UNREACHABLE_IMAGE);
    }
  }
}
