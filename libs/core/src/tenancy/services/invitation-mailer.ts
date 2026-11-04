import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { TeamEmailsService } from '../../notifications/services/team-emails.service.js';
import type { CreatedInvitation } from '../repositories/workspace-invitation.repository.js';
import { roleName } from '../rules/role-name.js';
import {
  INVITATION_ACCEPT_PATH,
  INVITATION_TOKEN_QUERY,
  INVITATION_TTL_DAYS,
} from '../tenancy.constants.js';

/** Emails an invitation with its link to the web app's accept page. */
@Injectable()
export class InvitationMailer {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly emails: TeamEmailsService,
  ) {}

  send(invitation: CreatedInvitation, token: string): void {
    const url = new URL(INVITATION_ACCEPT_PATH, this.appConfig.webAppUrl);
    url.searchParams.set(INVITATION_TOKEN_QUERY, token);
    this.emails.sendWorkspaceInvitation({
      to: invitation.email,
      inviterName: invitation.invitedByName,
      workspaceName: invitation.workspaceName,
      roleName: roleName(invitation),
      url: url.toString(),
      expiresInDays: INVITATION_TTL_DAYS,
    });
  }
}
