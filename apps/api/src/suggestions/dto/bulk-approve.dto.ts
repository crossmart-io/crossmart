import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { type BulkReviewResult, SUGGESTIONS_BULK_MAX } from '@crossmart/core';
import { SuggestionDto } from './suggestion.dto.js';

export class BulkApproveSuggestionsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    minItems: 1,
    maxItems: SUGGESTIONS_BULK_MAX,
    description: 'Pending suggestions to approve; others are skipped',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(SUGGESTIONS_BULK_MAX)
  @IsUUID('all', { each: true })
  suggestionIds: string[];
}

export class BulkReviewResultDto implements BulkReviewResult {
  @ApiProperty({
    type: [SuggestionDto],
    description: 'Each suggestion reviewed: `APPLIED`, or `STALE` when its field had changed',
  })
  items: SuggestionDto[];

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Ids not found in the workspace or no longer pending',
  })
  skippedIds: string[];

  static from(result: BulkReviewResult): BulkReviewResultDto {
    return Object.assign(new BulkReviewResultDto(), {
      items: result.items.map((item) => SuggestionDto.from(item)),
      skippedIds: result.skippedIds,
    });
  }
}
