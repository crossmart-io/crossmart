import { Injectable } from '@nestjs/common';
import { MailSender } from '@crossmart/common';
import {
  type SandboxClaimEmailInput,
  sandboxClaimEmail,
  sandboxClaimReminderEmail,
} from '../emails/sandbox.emails.js';
import { BackgroundEmails } from './background-emails.js';

/** Sends the claim link of a sandbox account an AI agent opened (ADR 0019), and its reminder. */
@Injectable()
export class SandboxEmailsService extends BackgroundEmails {
  constructor(mail: MailSender) {
    super(mail);
  }

  sendClaimLink(input: SandboxClaimEmailInput): void {
    this.sendInBackground(sandboxClaimEmail(input));
  }

  sendClaimReminder(input: SandboxClaimEmailInput): void {
    this.sendInBackground(sandboxClaimReminderEmail(input));
  }
}
