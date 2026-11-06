import { Injectable } from '@nestjs/common';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { multipartBody } from '../../sdk/http/multipart-body.js';
import type { FetchedImage } from '../../sdk/images/image-fetcher.js';
import { EtsyApiClient } from '../api/etsy-api.client.js';
import { type EtsyShopContext, shopParams } from '../api/etsy-shop-context.js';
import {
  ETSY_LISTING_IMAGES_PATH,
  ETSY_SHOP_LISTING_IMAGE_PATH,
  ETSY_SHOP_LISTING_IMAGES_PATH,
  EtsyPathParam,
} from '../etsy.constants.js';
import { etsyListingImagesSchema, etsyUploadedImageSchema } from './etsy-listing.types.js';

/** `uploadListingImage` form fields. */
enum ImageField {
  Image = 'image',
  Rank = 'rank',
  Overwrite = 'overwrite',
  AltText = 'alt_text',
}

/** An image to put at a position of a listing. */
export interface EtsyImageUpload {
  image: FetchedImage;
  rank: number;
  altText: string | null;
}

/** An image a listing has: its id and position (1 is the first). */
export interface EtsyListedImage {
  imageId: string;
  rank: number;
}

/** A listing's images (`getListingImages`, `uploadListingImage`, `deleteListingImage`). */
@Injectable()
export class EtsyImageClient {
  constructor(private readonly api: EtsyApiClient) {}

  async list(shop: EtsyShopContext, listingId: string): Promise<EtsyListedImage[]> {
    const { results } = await this.api.get(
      {
        path: ETSY_LISTING_IMAGES_PATH,
        params: { [EtsyPathParam.ListingId]: listingId },
        accessToken: shop.accessToken,
      },
      etsyListingImagesSchema,
    );
    return results.map((image) => ({ imageId: String(image.listing_image_id), rank: image.rank }));
  }

  /** Uploads the file at `rank`, replacing the image there (`overwrite`). */
  async upload(shop: EtsyShopContext, listingId: string, upload: EtsyImageUpload): Promise<void> {
    const { image, rank, altText } = upload;
    await this.api.call(
      {
        method: HttpMethod.Post,
        path: ETSY_SHOP_LISTING_IMAGES_PATH,
        params: { ...shopParams(shop), [EtsyPathParam.ListingId]: listingId },
        accessToken: shop.accessToken,
        multipart: multipartBody({
          [ImageField.Image]: image,
          [ImageField.Rank]: String(rank),
          [ImageField.Overwrite]: String(true),
          ...(altText ? { [ImageField.AltText]: altText } : {}),
        }),
      },
      etsyUploadedImageSchema,
    );
  }

  delete(shop: EtsyShopContext, listingId: string, imageId: string): Promise<void> {
    return this.api.execute({
      method: HttpMethod.Delete,
      path: ETSY_SHOP_LISTING_IMAGE_PATH,
      params: {
        ...shopParams(shop),
        [EtsyPathParam.ListingId]: listingId,
        [EtsyPathParam.ListingImageId]: imageId,
      },
      accessToken: shop.accessToken,
    });
  }
}
