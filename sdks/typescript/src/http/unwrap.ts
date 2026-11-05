import { CrossmartApiError, CrossmartError } from '../errors.js';

/** What every `openapi-fetch` call resolves to. */
interface ApiResult<Data> {
  data?: Data;
  error?: unknown;
  response: Response;
}

const EMPTY_RESPONSE_MESSAGE = 'The Crossmart API returned no content where data was expected';

/** The response body of a successful call; a `CrossmartApiError` otherwise. */
export async function unwrap<Data>(call: Promise<ApiResult<Data>>): Promise<Data> {
  const { data } = await unwrapEmpty(call);
  if (data === undefined) {
    throw new CrossmartError(EMPTY_RESPONSE_MESSAGE);
  }
  return data;
}

/** For calls that answer 204 No Content: resolves when they succeed. */
export async function unwrapEmpty<Data>(call: Promise<ApiResult<Data>>): Promise<ApiResult<Data>> {
  const result = await call;
  if (!result.response.ok) {
    throw new CrossmartApiError(result.response.status, result.error);
  }
  return result;
}
