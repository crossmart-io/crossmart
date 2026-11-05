import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PickAgentWorkspaceDto {
  @ApiProperty({ format: 'uuid', description: 'A workspace the signed-in user belongs to' })
  @IsUUID()
  workspaceId: string;
}
