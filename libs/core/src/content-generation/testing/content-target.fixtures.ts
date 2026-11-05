import { ChannelType } from '@crossmart/connectors';
import { ActivityActorType } from '@crossmart/database';
import { productDetail } from '../../listings/testing/listing.fixtures.js';
import type { ContentGenerationJob } from '../entities/content-generation.js';
import { CHANNEL_CONTENT_RULES } from '../rules/channel-content-rules.js';
import type { GeneratedContent } from '../rules/generated-content.schema.js';
import type { ContentTarget } from '../services/content-target.loader.js';

export const WORKSPACE_ID = '0b6c1d4e-7f0a-4c55-9a39-3c1f4b7e9d01';
export const CONNECTION_ID = '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a';
export const PRODUCT_ID = '3f1c2b7a-9e8d-4c6b-a5f4-e3d2c1b0a9f8';

export const CONTENT_JOB: ContentGenerationJob = {
  workspaceId: WORKSPACE_ID,
  connectionId: CONNECTION_ID,
  productId: PRODUCT_ID,
  requestedBy: { type: ActivityActorType.USER, userId: 'user-1', apiKeyId: null },
};

/** The product of the listing fixtures on an eBay store. */
export function contentTarget(channel = ChannelType.Ebay): ContentTarget {
  const rules = CHANNEL_CONTENT_RULES[channel];
  if (!rules) throw new Error(`No content rules for ${channel}`);
  return {
    workspaceId: WORKSPACE_ID,
    store: { id: CONNECTION_ID, displayName: 'eBay US' },
    rules,
    product: productDetail(),
    current: { title: 'Mug', descriptionHtml: '<p>Stoneware.</p>' },
  };
}

export const GENERATED: GeneratedContent = {
  title: 'Acme Stoneware Mug Blue 350 ml',
  titleRationale: 'Leads with brand and the attributes buyers filter by.',
  descriptionHtml: '<p>Hand-glazed stoneware mug.</p><ul><li>Blue</li></ul>',
  descriptionRationale: 'Scannable list of facts.',
};
