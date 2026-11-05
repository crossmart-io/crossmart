import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { EbayAccountDeletionService, EbayDeletionChallengeService } from '@crossmart/core';
import { Public } from '../../auth/decorators/public.decorator.js';
import { EBAY_ACCOUNT_DELETION_ROUTE } from '../channels.constants.js';
import {
  EbayChallengeQueryDto,
  EbayChallengeResponseDto,
} from '../dto/ebay-account-deletion.dto.js';
import { toHeaderRecord } from '../query-record.js';

const MISSING_BODY = 'A notification needs a body';

/**
 * eBay's marketplace account deletion endpoint, which eBay requires before it activates a
 * production keyset. Public, because eBay calls it: the challenge proves Crossmart holds the
 * verification token, and every notice is verified against eBay's signature before it is read.
 */
@ApiExcludeController()
@Controller(EBAY_ACCOUNT_DELETION_ROUTE)
export class EbayAccountDeletionController {
  constructor(
    private readonly challenge: EbayDeletionChallengeService,
    private readonly deletions: EbayAccountDeletionService,
  ) {}

  /** eBay checks the endpoint when it is saved in the developer portal. */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  respondToChallenge(@Query() query: EbayChallengeQueryDto): EbayChallengeResponseDto {
    return { challengeResponse: this.challenge.respond(query.challenge_code) };
  }

  /** 204 once a notice is verified and handled; 412 when its signature does not verify. */
  @Post()
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async receive(@Req() request: RawBodyRequest<Request>): Promise<void> {
    if (!request.rawBody) {
      throw new BadRequestException(MISSING_BODY);
    }
    await this.deletions.receive({
      rawBody: request.rawBody,
      headers: toHeaderRecord(request.headers),
    });
  }
}
