import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, InvitationsService } from '@crossmart/core';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import { Public } from '../../auth/decorators/public.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import {
  AcceptedInvitationDto,
  InvitationPreviewDto,
  InvitationTokenDto,
} from '../dto/invitation.dto.js';
import {
  INVITATION_ACCEPT_ROUTE,
  INVITATION_PREVIEW_ROUTE,
  INVITATIONS_ROUTE,
  MEMBERS_TAG,
} from '../workspaces.constants.js';

/** For the person who opened an invitation link. */
@ApiTags(MEMBERS_TAG)
@Controller(INVITATIONS_ROUTE)
export class InvitationLinksController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post(INVITATION_PREVIEW_ROUTE)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'What an invitation link is for',
    description:
      'Open to anyone with the link, so it can be shown before signing in. 404 when ' +
      'the link is unknown, used, revoked or expired.',
  })
  @ApiOkResponse({ type: InvitationPreviewDto })
  async preview(@Body() body: InvitationTokenDto): Promise<InvitationPreviewDto> {
    return InvitationPreviewDto.from(await this.invitations.preview(body.token));
  }

  @Post(INVITATION_ACCEPT_ROUTE)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Accept an invitation and join its workspace',
    description: 'Needs a signed-in user whose email is the invited address (403 otherwise).',
  })
  @ApiOkResponse({ type: AcceptedInvitationDto })
  async accept(
    @Body() body: InvitationTokenDto,
    @CurrentPrincipal() principal: Principal,
    @CurrentActor() actor: Actor,
  ): Promise<AcceptedInvitationDto> {
    const { userId, email } = requireUser(principal);
    return AcceptedInvitationDto.from(
      await this.invitations.accept(body.token, { userId, email }, actor),
    );
  }
}
