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
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { type Actor, InvitationsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import {
  type ActingManager,
  CurrentManager,
} from '../../auth/decorators/current-manager.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { InvitationDto } from '../dto/invitation.dto.js';
import { InviteMemberDto } from '../dto/invite-member.dto.js';
import {
  INVITATION_ID_PARAM,
  MEMBERS_TAG,
  WORKSPACE_INVITATIONS_ROUTE,
} from '../workspaces.constants.js';

@ApiTags(MEMBERS_TAG)
@Controller(WORKSPACE_INVITATIONS_ROUTE)
@RequirePermission(WorkspacePermission.ManageMembers)
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get()
  @ApiOperation({ summary: 'Pending invitations of a workspace' })
  @ApiOkResponse({ type: [InvitationDto] })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<InvitationDto[]> {
    const invitations = await this.invitations.listPending(workspaceId);
    return invitations.map((invitation) => InvitationDto.from(invitation));
  }

  @Post()
  @ApiOperation({
    summary: 'Invite someone by email',
    description:
      'Emails a link that works for 7 days. A new invitation to the same address replaces the ' +
      'pending one. Refused (409) for members and past 50 pending invitations.',
  })
  @ApiCreatedResponse({ type: InvitationDto })
  async invite(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: InviteMemberDto,
    @CurrentManager() { manager, actor }: ActingManager,
  ): Promise<InvitationDto> {
    return InvitationDto.from(await this.invitations.invite(workspaceId, manager, body, actor));
  }

  @Delete(`:${INVITATION_ID_PARAM}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a pending invitation; its link stops working' })
  @ApiNoContentResponse()
  revoke(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(INVITATION_ID_PARAM, ParseUUIDPipe) invitationId: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    return this.invitations.revoke(workspaceId, invitationId, actor);
  }
}
