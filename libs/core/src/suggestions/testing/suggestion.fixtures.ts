import { SuggestionCreatorType, SuggestionStatus } from '@crossmart/database';
import { ChannelType } from '@crossmart/connectors';
import { SuggestionAgent } from '../enums/suggestion-agent.enum.js';
import { SuggestionKind } from '../enums/suggestion-kind.enum.js';
import type { SuggestionRecord } from '../repositories/suggestion.queries.js';

export const WORKSPACE_ID = '0b6c1d4e-7f0a-4c55-9a39-3c1f4b7e9d01';
export const CONNECTION_ID = '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a';
export const PRODUCT_ID = '3f1c2b7a-9e8d-4c6b-a5f4-e3d2c1b0a9f8';
export const SUGGESTION_ID = '01938a6e-0000-7000-8000-000000000001';
const AT = new Date('2026-11-05T09:00:00Z');

/** A pending title suggestion from the Content Generator, as the repository returns it. */
export function suggestionRecord(overrides: Partial<SuggestionRecord> = {}): SuggestionRecord {
  return {
    id: SUGGESTION_ID,
    workspaceId: WORKSPACE_ID,
    productId: PRODUCT_ID,
    connectionId: CONNECTION_ID,
    kind: SuggestionKind.ListingTitle,
    status: SuggestionStatus.PENDING,
    currentValue: 'Mug',
    proposedValue: 'Stoneware Mug, Blue, 350 ml',
    rationale: 'Names the material and size buyers search for.',
    createdByType: SuggestionCreatorType.AGENT,
    agent: SuggestionAgent.ContentGenerator,
    requestedByUserId: 'user-1',
    requestedByApiKeyId: null,
    reviewedByUserId: null,
    reviewedByApiKeyId: null,
    reviewedAt: null,
    createdAt: AT,
    updatedAt: AT,
    product: { title: 'Mug', media: [{ url: 'https://cdn.example.com/1.jpg' }] },
    connection: { id: CONNECTION_ID, channel: ChannelType.Ebay, displayName: 'eBay US' },
    requestedByUser: { name: 'Dana Levin' },
    requestedByApiKey: null,
    reviewedByUser: null,
    reviewedByApiKey: null,
    ...overrides,
  };
}
