import { Injectable, Logger } from '@nestjs/common';
import { type MailMessage, MailSender } from '@crossmart/common';
import {
  type AccountEmailInput,
  emailVerificationEmail,
  passwordResetEmail,
} from '../emails/account.emails.js';

/**
 * Sends the emails that guard an account. Sending runs in the background: an attacker must not
 * learn from the response time whether an address has an account.
 */
@Injectable()
export class AccountEmailsService {
  private readonly logger = new Logger(AccountEmailsService.name);

  constructor(private readonly mail: MailSender) {}

  sendPasswordReset(input: AccountEmailInput): void {
    this.sendInBackground(passwordResetEmail(input));
  }

  sendEmailVerification(input: AccountEmailInput): void {
    this.sendInBackground(emailVerificationEmail(input));
  }

  private sendInBackground(message: MailMessage): void {
    this.mail.send(message).catch((error: unknown) => {
      this.logger.error(`Could not send "${message.subject}": ${String(error)}`);
    });
  }
}
