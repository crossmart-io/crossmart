import { ApiProperty } from '@nestjs/swagger';
import { AgentClientRegistration, type AgentConnection, AgentScope } from '@crossmart/core';
import {
  AGENT_CLIENT_REGISTRATION_SCHEMA_NAME,
  AGENT_SCOPE_SCHEMA_NAME,
} from '../agents.constants.js';

export class AgentConnectionDto implements AgentConnection {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    description: 'The OAuth client id: a Client ID Metadata Document URL, or a registered id',
  })
  clientId: string;

  @ApiProperty({ description: 'The name the agent gives, such as "Claude"' })
  clientName: string;

  @ApiProperty({
    enum: AgentClientRegistration,
    enumName: AGENT_CLIENT_REGISTRATION_SCHEMA_NAME,
    description:
      'Whether `clientName` came from a verified host (`metadata_document`) or is only what the ' +
      'agent calls itself (`dynamic`)',
  })
  clientRegistration: AgentClientRegistration;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'For a `metadata_document` client: the host its metadata came from',
  })
  clientVerifiedHost: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'The agent’s home page' })
  clientUri: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The agent’s logo address, from its metadata. Crossmart never fetches it.',
  })
  clientIcon: string | null;

  @ApiProperty({ format: 'uuid', description: 'The member who connected the agent' })
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  userEmail: string;

  @ApiProperty({ enum: AgentScope, enumName: AGENT_SCOPE_SCHEMA_NAME, isArray: true })
  scopes: AgentScope[];

  @ApiProperty()
  connectedAt: Date;

  static from(connection: AgentConnection): AgentConnectionDto {
    return Object.assign(new AgentConnectionDto(), connection);
  }
}
