import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { ChannelType } from '@crossmart/connectors';
import { ChannelWebhooksService } from '@crossmart/core';
import { Public } from '../../auth/decorators/public.decorator.js';
import { CHANNEL_PARAM, WEBHOOKS_ROUTE } from '../channels.constants.js';
import { toHeaderRecord } from '../query-record.js';

const MISSING_BODY = 'A webhook needs a body';

/**
 * Receives channel webhooks. Public, because channels call it; every delivery is verified
 * against its signature over the raw body before anything is read, and 401s otherwise.
 */
@ApiExcludeController()
@Controller(WEBHOOKS_ROUTE)
export class ChannelWebhooksController {
  constructor(private readonly webhooks: ChannelWebhooksService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Param(CHANNEL_PARAM, new ParseEnumPipe(ChannelType)) channel: ChannelType,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<void> {
    if (!request.rawBody) {
      throw new BadRequestException(MISSING_BODY);
    }
    await this.webhooks.handle(channel, {
      rawBody: request.rawBody,
      headers: toHeaderRecord(request.headers),
    });
  }
}
