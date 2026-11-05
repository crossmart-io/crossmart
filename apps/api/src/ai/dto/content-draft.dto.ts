import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  CONTENT_DRAFT_INSTRUCTION_MAX_LENGTH,
  CONTENT_DRAFT_TEXT_MAX_LENGTH,
  type ContentDraft,
  ContentField,
} from '@crossmart/core';
import { CONTENT_FIELD_SCHEMA_NAME } from '../ai.constants.js';

export class CreateContentDraftDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'The store the text is for; leave out for the catalog’s own content',
  })
  @IsOptional()
  @IsUUID()
  connectionId?: string;

  @ApiProperty({
    enum: ContentField,
    enumName: CONTENT_FIELD_SCHEMA_NAME,
    isArray: true,
    minItems: 1,
    description: 'The fields to rewrite',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(ContentField, { each: true })
  fields: ContentField[];

  @ApiPropertyOptional({
    maxLength: CONTENT_DRAFT_INSTRUCTION_MAX_LENGTH,
    description: 'What to change, such as "shorter" or "mention it is dishwasher-safe"',
  })
  @IsOptional()
  @IsString()
  @MaxLength(CONTENT_DRAFT_INSTRUCTION_MAX_LENGTH)
  instruction?: string;

  @ApiPropertyOptional({
    maxLength: CONTENT_DRAFT_TEXT_MAX_LENGTH,
    description: 'The title as edited and not yet saved; the saved one when left out',
  })
  @IsOptional()
  @IsString()
  @MaxLength(CONTENT_DRAFT_TEXT_MAX_LENGTH)
  title?: string;

  @ApiPropertyOptional({
    maxLength: CONTENT_DRAFT_TEXT_MAX_LENGTH,
    description: 'The description as edited and not yet saved; the saved one when left out',
  })
  @IsOptional()
  @IsString()
  @MaxLength(CONTENT_DRAFT_TEXT_MAX_LENGTH)
  descriptionHtml?: string;
}

export class ContentDraftDto implements ContentDraft {
  @ApiProperty({ type: String, nullable: true, description: 'Null when not asked for' })
  title: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'Null when not asked for' })
  descriptionHtml: string | null;

  static from(draft: ContentDraft): ContentDraftDto {
    return Object.assign(new ContentDraftDto(), draft);
  }
}
