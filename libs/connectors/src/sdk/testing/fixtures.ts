import { readFileSync } from 'node:fs';
import { HTTP_STATUS_SUCCESS_MIN } from '../http/http.constants.js';
import type { HttpResponse } from '../http/http-transport.js';
import { jsonResponse } from './fake-http-transport.js';

const FIXTURE_ENCODING = 'utf8';

/**
 * Reads a recorded fixture next to a test: `loadFixture(new URL('./__fixtures__/', import.meta.url), 'shop.json')`.
 * Fixtures hold fabricated data only, never real tokens or customer data.
 */
export function loadFixture(directory: URL, name: string): string {
  return readFileSync(new URL(name, directory), FIXTURE_ENCODING);
}

/** A recorded JSON fixture as an HTTP response. */
export function fixtureResponse(
  directory: URL,
  name: string,
  status = HTTP_STATUS_SUCCESS_MIN,
): HttpResponse {
  return jsonResponse(loadFixture(directory, name), status);
}
