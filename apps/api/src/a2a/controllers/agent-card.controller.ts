import { createHash } from 'node:crypto';
import { Controller, Get, Header, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../auth/decorators/public.decorator.js';
import {
  AGENT_CARD_MAX_AGE_SECONDS,
  AGENT_CARD_ROUTE,
  AGENT_CARD_VERSION,
} from '../a2a.constants.js';
import type { AgentCard } from '../entities/agent-card.js';
import { AgentCardFactory } from '../services/agent-card.factory.js';

const ETAG_HEADER = 'ETag';
const ACCESS_CONTROL_ALLOW_ORIGIN = 'Access-Control-Allow-Origin';
const ANY_ORIGIN = '*';
const HASH_ALGORITHM = 'sha256';
const HASH_ENCODING = 'base64url';

/**
 * Crossmart's A2A Agent Card at its well-known URI (A2A 1.0 §8.2), public and cacheable, with
 * an ETag of its content (§8.6).
 */
@ApiExcludeController()
@Controller({ path: AGENT_CARD_ROUTE, version: VERSION_NEUTRAL })
@Public()
export class AgentCardController {
  constructor(private readonly cards: AgentCardFactory) {}

  @Get()
  @Header('Cache-Control', `public, max-age=${AGENT_CARD_MAX_AGE_SECONDS}`)
  card(@Res({ passthrough: true }) response: Response): AgentCard {
    const card = this.cards.card(AGENT_CARD_VERSION);
    const etag = createHash(HASH_ALGORITHM).update(JSON.stringify(card)).digest(HASH_ENCODING);
    response.setHeader(ETAG_HEADER, `"${etag}"`);
    response.setHeader(ACCESS_CONTROL_ALLOW_ORIGIN, ANY_ORIGIN);
    return card;
  }
}
