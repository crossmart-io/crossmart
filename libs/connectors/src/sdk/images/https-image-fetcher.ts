import { lookup as dnsLookup } from 'node:dns';
import type { IncomingMessage } from 'node:http';
import { get as httpsGet } from 'node:https';
import { isIP } from 'node:net';
import { Injectable } from '@nestjs/common';
import { ACCEPT_HEADER, CONTENT_TYPE_HEADER } from '../http/http.constants.js';
import { isServerErrorStatus, isSuccessStatus } from '../http/http-status.js';
import { guardedLookup, isPublicAddress, PrivateAddressError } from '@crossmart/common';
import {
  type FetchedImage,
  ImageFetcher,
  ImageFetchError,
  ImageFetchFailure,
} from './image-fetcher.js';
import {
  DEFAULT_IMAGE_FILE_NAME,
  FILE_EXTENSION_SEPARATOR,
  IMAGE_ACCEPT_HEADER_VALUE,
  IMAGE_CONTENT_TYPE_PREFIX,
  IMAGE_FETCH_TIMEOUT_MS,
  IMAGE_MAX_BYTES,
  MEDIA_TYPE_PARAMETER_SEPARATOR,
  PATH_SEPARATOR,
} from './image.constants.js';

const HTTPS_PROTOCOL = 'https:';
const IPV6_LITERAL_BRACKETS = /^\[|\]$/g;
const CONTENT_LENGTH_HEADER = 'content-length';

/** The upload's file name: the URL's last path segment, or `image.<subtype>`. */
export function imageFileName(url: URL, contentType: string): string {
  const lastSegment = decodeURIComponent(url.pathname.split(PATH_SEPARATOR).pop() ?? '');
  if (lastSegment.includes(FILE_EXTENSION_SEPARATOR)) return lastSegment;
  const subtype = contentType.slice(IMAGE_CONTENT_TYPE_PREFIX.length);
  return `${DEFAULT_IMAGE_FILE_NAME}${FILE_EXTENSION_SEPARATOR}${subtype}`;
}

/**
 * Sockets skip the lookup for IP literals (`https://10.0.0.1/…`), so their address is checked
 * here; host names are checked by the guarded lookup as the socket connects.
 */
function assertPublicLiteral(url: URL): void {
  const host = url.hostname.replace(IPV6_LITERAL_BRACKETS, '');
  if (isIP(host) && !isPublicAddress(host)) {
    throw new ImageFetchError(ImageFetchFailure.PrivateAddress);
  }
}

function mediaTypeOf(response: IncomingMessage): string {
  const header = response.headers[CONTENT_TYPE_HEADER] ?? '';
  return header.split(MEDIA_TYPE_PARAMETER_SEPARATOR)[0]?.trim().toLowerCase() ?? '';
}

/** Why a response cannot be read as an image, before its body is read; null when it can. */
function responseFailure(response: IncomingMessage): ImageFetchError | null {
  const status = response.statusCode ?? 0;
  if (!isSuccessStatus(status)) {
    return new ImageFetchError(ImageFetchFailure.ErrorStatus, isServerErrorStatus(status));
  }
  if (!mediaTypeOf(response).startsWith(IMAGE_CONTENT_TYPE_PREFIX)) {
    return new ImageFetchError(ImageFetchFailure.NotAnImage);
  }
  const declared = Number(response.headers[CONTENT_LENGTH_HEADER] ?? 0);
  return declared > IMAGE_MAX_BYTES ? new ImageFetchError(ImageFetchFailure.TooLarge) : null;
}

function toFetchError(error: unknown): ImageFetchError {
  if (error instanceof ImageFetchError) return error;
  return new ImageFetchError(
    error instanceof PrivateAddressError
      ? ImageFetchFailure.PrivateAddress
      : ImageFetchFailure.Unreachable,
  );
}

/** Reads the body up to the size limit; larger bodies are abandoned. */
function readBody(response: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    response.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > IMAGE_MAX_BYTES) {
        response.destroy(new ImageFetchError(ImageFetchFailure.TooLarge));
        return;
      }
      chunks.push(chunk);
    });
    response.on('end', () => resolve(Buffer.concat(chunks)));
    response.on('error', reject);
  });
}

/**
 * Downloads images over `https` only, from public addresses only (checked as each socket
 * connects), without following redirects, within a size limit and a timeout.
 */
@Injectable()
export class HttpsImageFetcher extends ImageFetcher {
  private readonly lookup = guardedLookup(dnsLookup);

  async fetch(url: string): Promise<FetchedImage> {
    const parsed = URL.canParse(url) ? new URL(url) : null;
    if (parsed?.protocol !== HTTPS_PROTOCOL) {
      throw new ImageFetchError(ImageFetchFailure.NotHttps);
    }
    assertPublicLiteral(parsed);
    try {
      const response = await this.get(parsed);
      const failure = responseFailure(response);
      if (failure) {
        response.destroy();
        throw failure;
      }
      const contentType = mediaTypeOf(response);
      const bytes = await readBody(response);
      return { bytes, contentType, fileName: imageFileName(parsed, contentType) };
    } catch (error) {
      throw toFetchError(error);
    }
  }

  private get(url: URL): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      const request = httpsGet(url, {
        lookup: this.lookup,
        timeout: IMAGE_FETCH_TIMEOUT_MS,
        headers: { [ACCEPT_HEADER]: IMAGE_ACCEPT_HEADER_VALUE },
      });
      request.on('response', resolve);
      request.on('timeout', () =>
        request.destroy(new ImageFetchError(ImageFetchFailure.Unreachable)),
      );
      request.on('error', reject);
    });
  }
}
