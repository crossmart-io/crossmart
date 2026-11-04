import { Injectable } from '@nestjs/common';
import { MailSender } from '@crossmart/common';
import {
  type WorkspaceInvitationEmailInput,
  workspaceInvitationEmail,
} from '../emails/team.emails.js';
import { BackgroundEmails } from './background-emails.js';

/** Sends the emails about working together in a workspace. */
@Injectable()
export class TeamEmailsService extends BackgroundEmails {
  constructor(mail: MailSender) {
    super(mail);
  }

  sendWorkspaceInvitation(input: WorkspaceInvitationEmailInput): void {
    this.sendInBackground(workspaceInvitationEmail(input));
  }
}
