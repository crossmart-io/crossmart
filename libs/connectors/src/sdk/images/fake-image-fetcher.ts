import { imageFileName } from './https-image-fetcher.js';
import {
  type FetchedImage,
  ImageFetcher,
  ImageFetchError,
  ImageFetchFailure,
} from './image-fetcher.js';

const FAKE_CONTENT_TYPE = 'image/jpeg';
/** The first bytes of a JPEG, enough to stand in for an image in tests. */
const FAKE_JPEG = Buffer.from('ffd8ffe0', 'hex');

/** Answers every URL with a tiny JPEG, or fails the URLs told to, and records each fetch. */
export class FakeImageFetcher extends ImageFetcher {
  readonly fetched: string[] = [];
  private readonly failures = new Map<string, ImageFetchError>();

  failOn(url: string, failure = ImageFetchFailure.ErrorStatus): this {
    this.failures.set(url, new ImageFetchError(failure));
    return this;
  }

  fetch(url: string): Promise<FetchedImage> {
    this.fetched.push(url);
    const failure = this.failures.get(url);
    if (failure) return Promise.reject(failure);
    const fileName = imageFileName(new URL(url), FAKE_CONTENT_TYPE);
    return Promise.resolve({ bytes: FAKE_JPEG, contentType: FAKE_CONTENT_TYPE, fileName });
  }
}
