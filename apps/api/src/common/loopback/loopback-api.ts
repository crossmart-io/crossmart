import { Injectable } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { AddressInfo } from 'node:net';
import { type ApiCredential, CrossmartApiClient } from '@crossmart/core';
import { API_NOT_LISTENING, LOOPBACK_HOST, LOOPBACK_PROTOCOL } from './loopback.constants.js';

/**
 * This API, called from inside itself over the loopback interface with the agent tools' own
 * client, so a call the server makes for an agent meets every guard any request meets: Crossmart
 * Agent's tools (ADR 0026) and outside agents' proposals (ADR 0028).
 */
@Injectable()
export class LoopbackApi {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  client(credential: ApiCredential): CrossmartApiClient {
    return new CrossmartApiClient(this.baseUrl(), credential);
  }

  /** This server's own address, on the port it actually listens on. */
  private baseUrl(): string {
    const address = this.adapterHost.httpAdapter.getHttpServer().address() as
      AddressInfo | string | null;
    if (!address || typeof address === 'string') throw new Error(API_NOT_LISTENING);
    return `${LOOPBACK_PROTOCOL}//${LOOPBACK_HOST}:${address.port}`;
  }
}
