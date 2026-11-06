/** An image downloaded to be uploaded to a channel. */
export interface FetchedImage {
  bytes: Buffer;
  /** The media type the server sent, such as `image/jpeg`. */
  contentType: string;
  /** A file name for the upload, from the URL's path. */
  fileName: string;
}

/** Why an image could not be downloaded. */
export enum ImageFetchFailure {
  /** Only `https` images are downloaded. */
  NotHttps = 'not_https',
  /** The host resolves to a private, loopback or reserved address. */
  PrivateAddress = 'private_address',
  /** No response arrived (DNS, network, timeout). */
  Unreachable = 'unreachable',
  /** The server answered with an error status, or a redirect (which is not followed). */
  ErrorStatus = 'error_status',
  /** The response is not an image. */
  NotAnImage = 'not_an_image',
  TooLarge = 'too_large',
}

const RETRYABLE_FAILURES: ReadonlySet<ImageFetchFailure> = new Set([ImageFetchFailure.Unreachable]);

/** A failed download. The message never holds the URL, which may carry signed parameters. */
export class ImageFetchError extends Error {
  constructor(
    readonly failure: ImageFetchFailure,
    /** True for server errors and outages, which may pass on a later try. */
    readonly retryable = RETRYABLE_FAILURES.has(failure),
  ) {
    super(`The image could not be downloaded (${failure})`);
    this.name = 'ImageFetchError';
  }
}

/**
 * Downloads a product image for channels that take image files rather than links (Etsy). The
 * URLs come from merchants and agents, so implementations must refuse private addresses.
 */
export abstract class ImageFetcher {
  /** Rejects with `ImageFetchError`. */
  abstract fetch(url: string): Promise<FetchedImage>;
}
