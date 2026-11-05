import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { CONTENT_GENERATION_MAX_PRODUCTS, type ContentGenerationReceipt } from '@crossmart/core';

export class GenerateContentDto {
  @ApiProperty({ format: 'uuid', description: 'The store to write for' })
  @IsUUID()
  connectionId: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    minItems: 1,
    maxItems: CONTENT_GENERATION_MAX_PRODUCTS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CONTENT_GENERATION_MAX_PRODUCTS)
  @IsUUID('all', { each: true })
  productIds: string[];
}

export class ContentGenerationReceiptDto implements ContentGenerationReceipt {
  @ApiProperty({ description: 'Products queued; their suggestions arrive in the inbox' })
  queued: number;

  static from(receipt: ContentGenerationReceipt): ContentGenerationReceiptDto {
    return Object.assign(new ContentGenerationReceiptDto(), receipt);
  }
}
