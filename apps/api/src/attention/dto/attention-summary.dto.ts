import { ApiProperty } from '@nestjs/swagger';
import { ChannelType, PublishRequirement } from '@crossmart/connectors';
import {
  type AttentionList,
  type AttentionListingGroup,
  type AttentionProposal,
  type AttentionStore,
  AttentionStoreReason,
  type AttentionSuggestion,
  type AttentionSummary,
  SuggestionKind,
} from '@crossmart/core';
import { ChannelConnectionStatus } from '@crossmart/database';
import {
  CHANNEL_CONNECTION_STATUS_SCHEMA_NAME,
  CHANNEL_TYPE_SCHEMA_NAME,
  PUBLISH_REQUIREMENT_SCHEMA_NAME,
} from '../../channels/channels.constants.js';
import { SUGGESTION_KIND_SCHEMA_NAME } from '../../suggestions/suggestions.constants.js';
import { ATTENTION_STORE_REASON_SCHEMA_NAME } from '../attention.constants.js';

const ITEMS_DESCRIPTION = 'The latest ones, up to `limit`';

export class AttentionStoreDto implements AttentionStore {
  @ApiProperty({ format: 'uuid' })
  connectionId: string;

  @ApiProperty({ enum: ChannelType, enumName: CHANNEL_TYPE_SCHEMA_NAME })
  channel: ChannelType;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ enum: ChannelConnectionStatus, enumName: CHANNEL_CONNECTION_STATUS_SCHEMA_NAME })
  status: ChannelConnectionStatus;

  @ApiProperty({ type: String, nullable: true })
  statusReason: string | null;

  @ApiProperty({ enum: AttentionStoreReason, enumName: ATTENTION_STORE_REASON_SCHEMA_NAME })
  reason: AttentionStoreReason;

  @ApiProperty({ description: 'Listings still on the channel (not delisted)' })
  liveListings: number;
}

export class AttentionListingGroupDto implements AttentionListingGroup {
  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  productTitle: string;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ format: 'uuid' })
  connectionId: string;

  @ApiProperty({ enum: ChannelType, enumName: CHANNEL_TYPE_SCHEMA_NAME })
  channel: ChannelType;

  @ApiProperty()
  storeName: string;

  @ApiProperty({ description: 'Failed listings of the product on this store' })
  failedListings: number;

  @ApiProperty({ type: String, nullable: true, description: 'The channel’s latest refusal' })
  lastError: string | null;

  @ApiProperty({
    enum: PublishRequirement,
    enumName: PUBLISH_REQUIREMENT_SCHEMA_NAME,
    nullable: true,
    description: 'What the channel asks for, when details are missing rather than an error',
  })
  missingRequirement: PublishRequirement | null;

  @ApiProperty()
  updatedAt: Date;
}

export class AttentionProposalDto implements AttentionProposal {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Claude' })
  agentName: string;

  @ApiProperty({ example: 'update_variant_price' })
  toolName: string;

  @ApiProperty({ example: 'Change a variant’s price' })
  toolTitle: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  expiresAt: Date;
}

export class AttentionSuggestionDto implements AttentionSuggestion {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  productTitle: string;

  @ApiProperty({ enum: SuggestionKind, enumName: SUGGESTION_KIND_SCHEMA_NAME })
  kind: SuggestionKind;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  connectionId: string | null;

  @ApiProperty({ type: String, nullable: true })
  storeName: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class AttentionStoresDto implements AttentionList<AttentionStore> {
  @ApiProperty({ description: 'Stores to reconnect or fix, and disconnected ones still listing' })
  count: number;

  @ApiProperty({ type: [AttentionStoreDto], description: ITEMS_DESCRIPTION })
  items: AttentionStoreDto[];
}

export class AttentionListingsDto implements AttentionList<AttentionListingGroup> {
  @ApiProperty({
    description: 'Failed listings across the stores, as the Channels page counts them',
  })
  count: number;

  @ApiProperty({
    type: [AttentionListingGroupDto],
    description: 'The latest products with failed listings, one per product and store',
  })
  items: AttentionListingGroupDto[];
}

export class AttentionProposalsDto implements AttentionList<AttentionProposal> {
  @ApiProperty({ description: 'Outside agents’ changes waiting for approval' })
  count: number;

  @ApiProperty({ type: [AttentionProposalDto], description: ITEMS_DESCRIPTION })
  items: AttentionProposalDto[];
}

export class AttentionSuggestionsDto implements AttentionList<AttentionSuggestion> {
  @ApiProperty({ description: 'AI suggestions waiting for review' })
  count: number;

  @ApiProperty({ type: [AttentionSuggestionDto], description: ITEMS_DESCRIPTION })
  items: AttentionSuggestionDto[];
}

/** What needs the merchant now. A section the caller may not see is null. */
export class AttentionSummaryDto implements AttentionSummary {
  @ApiProperty({ description: 'The sum of the visible sections’ counts, for one badge' })
  total: number;

  @ApiProperty({ type: AttentionStoresDto, nullable: true })
  stores: AttentionStoresDto | null;

  @ApiProperty({ type: AttentionListingsDto, nullable: true })
  listings: AttentionListingsDto | null;

  @ApiProperty({ type: AttentionProposalsDto, nullable: true })
  proposals: AttentionProposalsDto | null;

  @ApiProperty({ type: AttentionSuggestionsDto, nullable: true })
  suggestions: AttentionSuggestionsDto | null;

  static from(summary: AttentionSummary): AttentionSummaryDto {
    return Object.assign(new AttentionSummaryDto(), summary);
  }
}
