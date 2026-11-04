import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** The route parameters that name a product on one connection. */
export class ProductChannelParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  connectionId: string;
}
