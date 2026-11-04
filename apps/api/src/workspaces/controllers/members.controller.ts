import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  type Actor,
  MembershipService,
  WorkspaceAccessService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  type ActingManager,
  CurrentManager,
} from '../../auth/decorators/current-manager.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto.js';
import { WorkspaceMemberDto } from '../dto/workspace-member.dto.js';
import {
  MEMBER_USER_ID_PARAM,
  MEMBERS_TAG,
  MEMBERSHIP_ROUTE,
  WORKSPACE_MEMBERS_ROUTE,
} from '../workspaces.constants.js';

@ApiTags(MEMBERS_TAG)
@Controller(WORKSPACE_MEMBERS_ROUTE)
export class MembersController {
  constructor(
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly membership: MembershipService,
  ) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewMembers)
  @ApiOperation({ summary: 'The members of a workspace' })
  @ApiOkResponse({ type: [WorkspaceMemberDto] })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<WorkspaceMemberDto[]> {
    const members = await this.workspaceAccess.listMembers(workspaceId);
    return members.map((member) => WorkspaceMemberDto.from(member));
  }

  @Patch(`:${MEMBER_USER_ID_PARAM}`)
  @RequirePermission(WorkspacePermission.ManageMembers)
  @ApiOperation({
    summary: "Change a member's role",
    description:
      'Only for members whose role yours covers, to a role yours covers. Their API keys that ' +
      'the new role could not have created are revoked.',
  })
  @ApiOkResponse({ type: WorkspaceMemberDto })
  async changeRole(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(MEMBER_USER_ID_PARAM, ParseUUIDPipe) userId: string,
    @Body() body: UpdateMemberRoleDto,
    @CurrentManager() { manager, actor }: ActingManager,
  ): Promise<WorkspaceMemberDto> {
    const change = { userId, role: body.role };
    return WorkspaceMemberDto.from(
      await this.membership.changeRole(workspaceId, manager, change, actor),
    );
  }

  @Delete(`:${MEMBER_USER_ID_PARAM}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(WorkspacePermission.ManageMembers)
  @ApiOperation({
    summary: 'Remove a member',
    description: 'Only members whose role yours covers. Their API keys here are revoked.',
  })
  @ApiNoContentResponse()
  remove(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(MEMBER_USER_ID_PARAM, ParseUUIDPipe) userId: string,
    @CurrentManager() { manager, actor }: ActingManager,
  ): Promise<void> {
    return this.membership.remove(workspaceId, manager, userId, actor);
  }
}

/** Any member may leave; a workspace keeps at least one owner. */
@ApiTags(MEMBERS_TAG)
@ApiCookieAuth()
@Controller(MEMBERSHIP_ROUTE)
export class MembershipController {
  constructor(private readonly membership: MembershipService) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'Leave a workspace',
    description:
      'Your API keys here are revoked. Refused (409) for its last owner and for your only ' +
      'workspace.',
  })
  @ApiNoContentResponse()
  leave(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentPrincipal() principal: Principal,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    return this.membership.leave(workspaceId, requireUser(principal).userId, actor);
  }
}
