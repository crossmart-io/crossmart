import { ApiProperty } from '@nestjs/swagger';
import { ChannelType } from '@crossmart/connectors';
import {
  SuggestionAgent,
  type SuggestionConnectionView,
  type SuggestionCreatorView,
  SuggestionKind,
  type SuggestionPage,
  type SuggestionReviewView,
  type SuggestionView,
} from '@crossmart/core';
import { SuggestionCreatorType, SuggestionStatus } from '@crossmart/database';
import { CHANNEL_TYPE_SCHEMA_NAME } from '../../channels/channels.constants.js';
import {
  SUGGESTION_AGENT_SCHEMA_NAME,
  SUGGESTION_CREATOR_TYPE_SCHEMA_NAME,
  SUGGESTION_KIND_SCHEMA_NAME,
  SUGGESTION_STATUS_SCHEMA_NAME,
} from '../suggestions.constants.js';

export class SuggestionConnectionDto implements SuggestionConnectionView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ChannelType, enumName: CHANNEL_TYPE_SCHEMA_NAME })
  channel: ChannelType;

  @ApiProperty({ example: 'Demo Store' })
  displayName: string;
}

export class SuggestionCreatorDto implements SuggestionCreatorView {
  @ApiProperty({ enum: SuggestionCreatorType, enumName: SUGGESTION_CREATOR_TYPE_SCHEMA_NAME })
  type: SuggestionCreatorType;

  @ApiProperty({
    enum: SuggestionAgent,
    enumName: SUGGESTION_AGENT_SCHEMA_NAME,
    nullable: true,
    description: 'The agent that made it, for `AGENT` suggestions',
  })
  agent: SuggestionAgent | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, description: 'Who asked for it' })
  userId: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  apiKeyId: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'The user’s or API key’s name' })
  name: string | null;
}

export class SuggestionReviewDto implements SuggestionReviewView {
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  apiKeyId: string | null;

  @ApiProperty({ type: String, nullable: true })
  name: string | null;

  @ApiProperty()
  reviewedAt: Date;
}

/** A proposed change: what it replaces, what it proposes and why. */
export class SuggestionDto implements SuggestionView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ example: 'Stoneware Mug' })
  productTitle: string;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({
    type: SuggestionConnectionDto,
    nullable: true,
    description: 'The store the change is for; null for the product’s own content',
  })
  connection: SuggestionConnectionDto | null;

  @ApiProperty({ enum: SuggestionKind, enumName: SUGGESTION_KIND_SCHEMA_NAME })
  kind: SuggestionKind;

  @ApiProperty({ enum: SuggestionStatus, enumName: SUGGESTION_STATUS_SCHEMA_NAME })
  status: SuggestionStatus;

  @ApiProperty({ description: 'The value it replaces, as it was when it was made' })
  currentValue: string;

  @ApiProperty()
  proposedValue: string;

  @ApiProperty({ description: 'Why the agent proposes it' })
  rationale: string;

  @ApiProperty({ type: SuggestionCreatorDto })
  createdBy: SuggestionCreatorDto;

  @ApiProperty({ type: SuggestionReviewDto, nullable: true })
  review: SuggestionReviewDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(view: SuggestionView): SuggestionDto {
    return Object.assign(new SuggestionDto(), {
      ...view,
      connection: view.connection
        ? Object.assign(new SuggestionConnectionDto(), view.connection)
        : null,
      createdBy: Object.assign(new SuggestionCreatorDto(), view.createdBy),
      review: view.review ? Object.assign(new SuggestionReviewDto(), view.review) : null,
    });
  }
}

export class SuggestionPageDto implements SuggestionPage {
  @ApiProperty({ type: [SuggestionDto] })
  items: SuggestionDto[];

  @ApiProperty({ type: String, nullable: true, description: 'Null on the last page' })
  nextCursor: string | null;

  @ApiProperty({ description: 'How many match in all, for page numbers' })
  total: number;

  static from(page: SuggestionPage): SuggestionPageDto {
    return Object.assign(new SuggestionPageDto(), {
      items: page.items.map((item) => SuggestionDto.from(item)),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  }
}
