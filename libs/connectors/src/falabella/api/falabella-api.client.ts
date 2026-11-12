import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import { CONTENT_TYPE_HEADER, FORM_CONTENT_TYPE } from '../../sdk/http/http.constants.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { isSuccessStatus } from '../../sdk/http/http-status.js';
import { HttpTransport, type HttpResponse } from '../../sdk/http/http-transport.js';
import {
  FALABELLA_API_URL,
  FALABELLA_API_VERSION,
  FALABELLA_RESPONSE_FORMAT,
  FalabellaParam,
  USER_AGENT_HEADER,
  USER_AGENT_INTEGRATION,
  USER_AGENT_SEPARATOR,
  USER_AGENT_TECHNOLOGY,
} from '../falabella.constants.js';
import type { FalabellaAction } from '../falabella.enums.js';
import { falabellaCountry } from '../falabella-countries.js';
import type { FalabellaAccount } from './falabella-account.js';
import { falabellaFailure, unavailableFailure, unreadableFailure } from './falabella-failure.js';
import {
  errorResponseSchema,
  type FalabellaSuccess,
  successResponseSchema,
} from './falabella-responses.js';
import { canonicalQuery, falabellaTimestamp, signFalabellaQuery } from './falabella-signature.js';
import { parseFalabellaXml } from './falabella-xml.js';

/** One Seller Center call: its action, its own parameters, and an XML body for writes. */
export interface FalabellaRequest {
  action: FalabellaAction;
  params?: Readonly<Record<string, string>>;
  /** An XML document; the call is a POST when there is one. */
  xml?: string;
}

/**
 * Calls the Seller Center API for one account. Every request is signed with the user's API
 * key (which is never sent) and names the seller and country in its User-Agent. Answers are
 * XML, read into the caller's schema; an `ErrorResponse` becomes a `ChannelError`.
 */
@Injectable()
export class FalabellaApiClient {
  constructor(private readonly http: HttpTransport) {}

  async call<TBody>(
    account: FalabellaAccount,
    request: FalabellaRequest,
    body: z.ZodType<TBody>,
  ): Promise<FalabellaSuccess<TBody>> {
    const document = this.read(await this.send(account, request));
    const parsed = successResponseSchema(body).safeParse(document);
    if (!parsed.success) {
      throw unavailableFailure();
    }
    const { Head, Body } = parsed.data.SuccessResponse;
    return { head: Head, body: Body };
  }

  private async send(account: FalabellaAccount, request: FalabellaRequest): Promise<HttpResponse> {
    try {
      return await this.http.send({
        method: request.xml === undefined ? HttpMethod.Get : HttpMethod.Post,
        url: this.url(account, request),
        headers: this.headers(account, request),
        ...(request.xml === undefined ? {} : { body: request.xml }),
      });
    } catch {
      throw unavailableFailure();
    }
  }

  /** The XML of the response; throws what an `ErrorResponse` or an unreadable reply means. */
  private read(response: HttpResponse): unknown {
    let document: unknown;
    try {
      document = parseFalabellaXml(response.body);
    } catch {
      throw unreadableFailure(response.status);
    }
    const error = errorResponseSchema.safeParse(document);
    if (error.success) throw falabellaFailure(error.data.ErrorResponse);
    if (!isSuccessStatus(response.status)) throw unreadableFailure(response.status);
    return document;
  }

  private url(account: FalabellaAccount, request: FalabellaRequest): string {
    const params: Record<string, string> = {
      ...request.params,
      [FalabellaParam.Action]: request.action,
      [FalabellaParam.Format]: FALABELLA_RESPONSE_FORMAT,
      [FalabellaParam.Timestamp]: falabellaTimestamp(new Date()),
      [FalabellaParam.UserId]: account.userId,
      [FalabellaParam.Version]: FALABELLA_API_VERSION,
    };
    const signature = signFalabellaQuery(params, account.apiKey);
    return `${FALABELLA_API_URL}?${canonicalQuery({ ...params, [FalabellaParam.Signature]: signature })}`;
  }

  /**
   * `SELLER_ID/Node/<version>/CROSSMART/<business unit>`. Writes carry their XML as the raw
   * body, with the content type of the docs' cURL and Java samples.
   */
  private headers(account: FalabellaAccount, request: FalabellaRequest): Record<string, string> {
    const userAgent = [
      account.sellerId,
      USER_AGENT_TECHNOLOGY,
      process.versions.node,
      USER_AGENT_INTEGRATION,
      falabellaCountry(account.country).businessUnitCode,
    ].join(USER_AGENT_SEPARATOR);
    return {
      [USER_AGENT_HEADER]: userAgent,
      ...(request.xml === undefined ? {} : { [CONTENT_TYPE_HEADER]: FORM_CONTENT_TYPE }),
    };
  }
}
