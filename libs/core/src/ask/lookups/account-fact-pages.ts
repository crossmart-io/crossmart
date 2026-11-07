import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { CHUNK_TITLE_SEPARATOR } from '../ask.constants.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { KnowledgeSourceKind } from '../enums/knowledge-source-kind.enum.js';

/** The web app pages account facts are cited by. */
export const ACCOUNT_PAGES = {
  product: '/products/',
  billing: '/settings/billing',
  channels: '/channels',
} as const;
const ACCOUNT_TITLE = 'Your workspace';
const ACCOUNT_CHUNK_ID_PREFIX = 'account:';

/** One fact of a lookup: what it is about, the app page it comes from, and the text. */
export interface AccountFact {
  id: string;
  title: string;
  path: string;
  text: string;
}

/** Turns lookup facts into sources cited by the page of the web app they come from. */
@Injectable()
export class AccountFactPages {
  constructor(private readonly config: AppConfigService) {}

  chunk(fact: AccountFact): KnowledgeChunk {
    return {
      id: `${ACCOUNT_CHUNK_ID_PREFIX}${fact.id}`,
      source: KnowledgeSourceKind.Account,
      title: `${ACCOUNT_TITLE}${CHUNK_TITLE_SEPARATOR}${fact.title}`,
      url: `${this.config.webAppUrl}${fact.path}`,
      text: fact.text,
    };
  }
}
