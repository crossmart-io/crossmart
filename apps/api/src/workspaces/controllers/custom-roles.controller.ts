import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { type Actor, CustomRolesService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import {
  type ActingManager,
  CurrentManager,
} from '../../auth/decorators/current-manager.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CustomRoleDto, CustomRoleInputDto, RoleCatalogDto } from '../dto/custom-role.dto.js';
import { CUSTOM_ROLE_ID_PARAM, CUSTOM_ROLES_ROUTE, ROLES_TAG } from '../workspaces.constants.js';

/** The roles of a workspace: the fixed built-in ones, and its own, which it can change. */
@ApiTags(ROLES_TAG)
@Controller(CUSTOM_ROLES_ROUTE)
export class CustomRolesController {
  constructor(private readonly customRoles: CustomRolesService) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewMembers)
  @ApiOperation({
    summary: 'Every role: the built-in ones with their permissions, and custom ones',
  })
  @ApiOkResponse({ type: RoleCatalogDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<RoleCatalogDto> {
    return RoleCatalogDto.from(await this.customRoles.list(workspaceId));
  }

  @Post()
  @RequirePermission(WorkspacePermission.ManageMembers)
  @ApiOperation({ summary: 'Create a role from permissions you have' })
  @ApiCreatedResponse({ type: CustomRoleDto })
  async create(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: CustomRoleInputDto,
    @CurrentManager() { manager, actor }: ActingManager,
  ): Promise<CustomRoleDto> {
    return CustomRoleDto.from(await this.customRoles.create(workspaceId, manager, body, actor));
  }

  @Put(`:${CUSTOM_ROLE_ID_PARAM}`)
  @RequirePermission(WorkspacePermission.ManageMembers)
  @ApiOperation({
    summary: 'Change a role',
    description:
      'Applies to everyone holding it at once. API keys created by its members that now allow ' +
      'more than the role are revoked.',
  })
  @ApiOkResponse({ type: CustomRoleDto })
  async update(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CUSTOM_ROLE_ID_PARAM, ParseUUIDPipe) id: string,
    @Body() body: CustomRoleInputDto,
    @CurrentManager() { manager, actor }: ActingManager,
  ): Promise<CustomRoleDto> {
    const update = {
      id,
      name: body.name,
      description: body.description,
      permissions: body.permissions,
    };
    return CustomRoleDto.from(await this.customRoles.update(workspaceId, manager, update, actor));
  }

  @Delete(`:${CUSTOM_ROLE_ID_PARAM}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(WorkspacePermission.ManageMembers)
  @ApiOperation({
    summary: 'Delete a role',
    description: 'Refused (409) while members, pending invitations or API keys hold it.',
  })
  @ApiNoContentResponse()
  delete(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CUSTOM_ROLE_ID_PARAM, ParseUUIDPipe) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    return this.customRoles.delete(workspaceId, id, actor);
  }
}
