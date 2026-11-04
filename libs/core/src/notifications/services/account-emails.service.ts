import { Injectable } from '@nestjs/common';
import { MailSender } from '@crossmart/common';
import {
  type AccountEmailInput,
  emailVerificationEmail,
  passwordResetEmail,
} from '../emails/account.emails.js';
import { BackgroundEmails } from './background-emails.js';

/** Sends the emails that guard an account. */
@Injectable()
export class AccountEmailsService extends BackgroundEmails {
  constructor(mail: MailSender) {
    super(mail);
  }

  sendPasswordReset(input: AccountEmailInput): void {
    this.sendInBackground(passwordResetEmail(input));
  }

  sendEmailVerification(input: AccountEmailInput): void {
    this.sendInBackground(emailVerificationEmail(input));
  }
}
