import { ApiProperty } from '@nestjs/swagger';
import { type AgentClientProfile, AgentClientRegistration } from '@crossmart/core';
import { AGENT_CLIENT_REGISTRATION_SCHEMA_NAME } from '../agents.constants.js';

/** Who an agent asking for access is, and what of that Crossmart could check. */
export class AgentClientDto implements AgentClientProfile {
  @ApiProperty({
    description: 'The OAuth client id: a Client ID Metadata Document URL, or a registered id',
  })
  clientId: string;

  @ApiProperty({
    description:
      'The name to show. Verified only for a `metadata_document` client, through `verifiedHost`; ' +
      'a `dynamic` client chose it itself, and any client can call itself "Claude".',
  })
  name: string;

  @ApiProperty({
    enum: AgentClientRegistration,
    enumName: AGENT_CLIENT_REGISTRATION_SCHEMA_NAME,
    description:
      '`metadata_document`: Crossmart fetched the agent’s metadata from its HTTPS client id. ' +
      '`dynamic`: the agent registered itself, and its name and site are unverified.',
  })
  registration: AgentClientRegistration;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'claude.ai',
    description: 'For a `metadata_document` client: the host its metadata came from',
  })
  verifiedHost: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'For a `dynamic` client: the HTTPS host of the site it claims. Not verified.',
  })
  claimedHost: string | null;

  static from(profile: AgentClientProfile): AgentClientDto {
    return Object.assign(new AgentClientDto(), profile);
  }
}
