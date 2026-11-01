import { ApiProperty } from '@nestjs/swagger';
import type { ApiKeySummary, IssuedApiKey } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import { WORKSPACE_ROLE_SCHEMA_NAME } from '../workspaces.constants.js';

export class ApiKeyDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: WorkspaceRole, enumName: WORKSPACE_ROLE_SCHEMA_NAME })
  role: WorkspaceRole;

  @ApiProperty({ description: 'The first characters of the key, to tell keys apart' })
  prefix: string;

  @ApiProperty({ type: Date, nullable: true })
  lastUsedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  expiresAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  static from(summary: ApiKeySummary): ApiKeyDto {
    return Object.assign(new ApiKeyDto(), summary);
  }
}

export class IssuedApiKeyDto {
  @ApiProperty({ type: ApiKeyDto })
  apiKey: ApiKeyDto;

  @ApiProperty({ description: 'The full key. Shown once; store it now.' })
  secret: string;

  static from(issued: IssuedApiKey): IssuedApiKeyDto {
    return Object.assign(new IssuedApiKeyDto(), {
      apiKey: ApiKeyDto.from(issued.apiKey),
      secret: issued.secret,
    });
  }
}
