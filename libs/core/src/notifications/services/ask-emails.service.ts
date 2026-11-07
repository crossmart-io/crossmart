import { Injectable } from '@nestjs/common';
import { MailSender } from '@crossmart/common';
import {
  type AskEscalationOpenedEmailInput,
  type AskEscalationReplyEmailInput,
  askEscalationOpenedEmail,
  askEscalationReplyEmail,
} from '../emails/ask.emails.js';
import { BackgroundEmails } from './background-emails.js';

/** Sends the emails about Ask Crossmart's escalations to a person. */
@Injectable()
export class AskEmailsService extends BackgroundEmails {
  constructor(mail: MailSender) {
    super(mail);
  }

  sendEscalationOpened(input: AskEscalationOpenedEmailInput): void {
    this.sendInBackground(askEscalationOpenedEmail(input));
  }

  sendEscalationReply(input: AskEscalationReplyEmailInput): void {
    this.sendInBackground(askEscalationReplyEmail(input));
  }
}
