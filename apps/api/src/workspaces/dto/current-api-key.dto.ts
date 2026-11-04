import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@crossmart/database';
import type { ApiKeyPrincipal } from '../../auth/entities/principal.js';
import { WORKSPACE_ROLE_SCHEMA_NAME } from '../workspaces.constants.js';

export class CurrentApiKeyDto {
  @ApiProperty({ format: 'uuid' })
  apiKeyId: string;

  @ApiProperty({ format: 'uuid', description: 'The one workspace the key works in' })
  workspaceId: string;

  @ApiProperty({ enum: WorkspaceRole, enumName: WORKSPACE_ROLE_SCHEMA_NAME })
  role: WorkspaceRole;

  static from(principal: ApiKeyPrincipal): CurrentApiKeyDto {
    return Object.assign(new CurrentApiKeyDto(), {
      apiKeyId: principal.apiKeyId,
      workspaceId: principal.workspaceId,
      role: principal.role,
    });
  }
}
