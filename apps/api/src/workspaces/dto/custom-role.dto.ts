import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  BUILT_IN_ROLES,
  builtInPermissions,
  type BuiltInRole,
  CUSTOM_ROLE_DESCRIPTION_MAX_LENGTH,
  CUSTOM_ROLE_NAME_MAX_LENGTH,
  type CustomRoleInput,
  type CustomRoleSummary,
  toPermissionList,
  WorkspacePermission,
} from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import {
  WORKSPACE_PERMISSION_SCHEMA_NAME,
  WORKSPACE_ROLE_SCHEMA_NAME,
} from '../workspaces.constants.js';

const PERMISSION_COUNT = Object.values(WorkspacePermission).length;

export class CustomRoleInputDto implements CustomRoleInput {
  @ApiProperty({ example: 'Stock clerk', maxLength: CUSTOM_ROLE_NAME_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CUSTOM_ROLE_NAME_MAX_LENGTH)
  name: string;

  @ApiPropertyOptional({ maxLength: CUSTOM_ROLE_DESCRIPTION_MAX_LENGTH, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(CUSTOM_ROLE_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ApiProperty({
    enum: WorkspacePermission,
    enumName: WORKSPACE_PERMISSION_SCHEMA_NAME,
    isArray: true,
    description:
      'At most your own permissions. workspace:view is always added; workspace:delete is ' +
      'for owners only.',
  })
  @IsArray()
  @ArrayMaxSize(PERMISSION_COUNT)
  @IsEnum(WorkspacePermission, { each: true })
  permissions: WorkspacePermission[];
}

export class CustomRoleDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({
    enum: WorkspacePermission,
    enumName: WORKSPACE_PERMISSION_SCHEMA_NAME,
    isArray: true,
  })
  permissions: WorkspacePermission[];

  @ApiProperty({ description: 'Members holding the role now' })
  memberCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(role: CustomRoleSummary): CustomRoleDto {
    return Object.assign(new CustomRoleDto(), role);
  }
}

export class BuiltInRoleDto {
  @ApiProperty({ enum: WorkspaceRole, enumName: WORKSPACE_ROLE_SCHEMA_NAME })
  role: WorkspaceRole;

  @ApiProperty({
    enum: WorkspacePermission,
    enumName: WORKSPACE_PERMISSION_SCHEMA_NAME,
    isArray: true,
  })
  permissions: WorkspacePermission[];

  static from(role: BuiltInRole): BuiltInRoleDto {
    return Object.assign(new BuiltInRoleDto(), {
      role,
      permissions: toPermissionList(builtInPermissions(role)),
    });
  }
}

/** Every role a workspace can grant: the fixed built-in ones and its own. */
export class RoleCatalogDto {
  @ApiProperty({ type: [BuiltInRoleDto], description: 'Most access first' })
  builtIn: BuiltInRoleDto[];

  @ApiProperty({ type: [CustomRoleDto], description: 'By name' })
  custom: CustomRoleDto[];

  static from(custom: CustomRoleSummary[]): RoleCatalogDto {
    return Object.assign(new RoleCatalogDto(), {
      builtIn: BUILT_IN_ROLES.map((role) => BuiltInRoleDto.from(role)),
      custom: custom.map((role) => CustomRoleDto.from(role)),
    });
  }
}
