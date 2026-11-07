import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { BillingWebhookService } from '@crossmart/core';
import { Public } from '../../auth/decorators/public.decorator.js';
import {
  MISSING_WEBHOOK_BODY,
  STRIPE_SIGNATURE_HEADER,
  STRIPE_WEBHOOK_ROUTE,
} from '../billing.constants.js';

/**
 * Receives Stripe's billing events (ADR 0024). Public, because Stripe calls it; each delivery is
 * verified against its signature over the raw body before anything is read, and answers 400
 * otherwise. Handled events answer 200, and a failure 5xx, so Stripe retries it.
 */
@ApiExcludeController()
@Controller(STRIPE_WEBHOOK_ROUTE)
export class BillingWebhooksController {
  constructor(private readonly webhooks: BillingWebhookService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers(STRIPE_SIGNATURE_HEADER) signature: string | undefined,
  ): Promise<void> {
    if (!request.rawBody) throw new BadRequestException(MISSING_WEBHOOK_BODY);
    await this.webhooks.handle(request.rawBody, signature);
  }
}
