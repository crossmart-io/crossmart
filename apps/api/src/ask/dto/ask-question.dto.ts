import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ASK_QUESTION_MAX_LENGTH, ASK_QUESTION_MIN_LENGTH } from '@crossmart/core';

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class AskQuestionDto {
  @ApiProperty({
    minLength: ASK_QUESTION_MIN_LENGTH,
    maxLength: ASK_QUESTION_MAX_LENGTH,
    description: 'A question about Crossmart, in any language',
    example: 'Can I publish the same product to Shopify and eBay?',
  })
  @Transform(trimmed)
  @IsString()
  @MinLength(ASK_QUESTION_MIN_LENGTH)
  @MaxLength(ASK_QUESTION_MAX_LENGTH)
  question: string;
}
