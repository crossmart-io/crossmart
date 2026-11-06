import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AGENT_CLIENT_ID_MAX_LENGTH } from '../agents.constants.js';

export class AgentClientQueryDto {
  @ApiProperty({
    description: 'The `client_id` of the authorization request',
    maxLength: AGENT_CLIENT_ID_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(AGENT_CLIENT_ID_MAX_LENGTH)
  clientId: string;
}
