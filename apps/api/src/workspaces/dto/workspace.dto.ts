import { ApiProperty } from '@nestjs/swagger';
import {
  OutsideAgentChanges,
  type SandboxState,
  toPermissionList,
  type WorkspaceAccess,
  WorkspacePermission,
} from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import {
  WORKSPACE_PERMISSION_SCHEMA_NAME,
  WORKSPACE_ROLE_SCHEMA_NAME,
} from '../workspaces.constants.js';
import { OUTSIDE_AGENT_CHANGES_SCHEMA_NAME } from '../../agent-proposals/agent-proposals.constants.js';
import { CUSTOM_ROLE_PROPERTY, CustomRoleRefDto } from './role-assignment.dto.js';

/** An unclaimed sandbox account an AI agent opened (ADR 0019). */
export class SandboxStateDto {
  @ApiProperty({ description: 'When the claim link stops working and the account is deleted' })
  claimExpiresAt: Date;
}

export class WorkspaceDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'The name to show: the organization name while the workspace is named Default',
  })
  displayName: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 code of the catalog prices' })
  currency: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Asia/Jerusalem',
    description: 'IANA time zone that reports follow; null until set',
  })
  timeZone: string | null;

  @ApiProperty({
    type: SandboxStateDto,
    nullable: true,
    description:
      'Set while the workspace is an unclaimed sandbox account an AI agent opened: it cannot ' +
      'connect stores, publish or invite people until claimed. Null for every other workspace.',
  })
  sandbox: SandboxState | null;

  @ApiProperty({
    enum: OutsideAgentChanges,
    enumName: OUTSIDE_AGENT_CHANGES_SCHEMA_NAME,
    description:
      'What happens to changes by outside AI agents (OAuth agents and MCP sessions): ' +
      '`require_approval` (the default) makes each one a proposal to approve; ' +
      '`apply_directly` makes them at once. API keys over REST always apply directly.',
  })
  outsideAgentChanges: OutsideAgentChanges;

  @ApiProperty({
    enum: WorkspaceRole,
    enumName: WORKSPACE_ROLE_SCHEMA_NAME,
    description: 'Your role here',
  })
  role: WorkspaceRole;

  @ApiProperty(CUSTOM_ROLE_PROPERTY)
  customRole: CustomRoleRefDto | null;

  @ApiProperty({
    enum: WorkspacePermission,
    enumName: WORKSPACE_PERMISSION_SCHEMA_NAME,
    isArray: true,
    description: 'What your role lets you do here. Check these, not the role, to adapt a UI.',
  })
  permissions: WorkspacePermission[];

  static from(access: WorkspaceAccess): WorkspaceDto {
    return Object.assign(new WorkspaceDto(), access, {
      permissions: toPermissionList(access.permissions),
    });
  }
}
