import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** The route parameters that name one Agent Worker conversation in a workspace. */
export class AgentWorkerConversationParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  conversationId: string;
}
