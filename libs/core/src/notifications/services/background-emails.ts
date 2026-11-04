import { Logger } from '@nestjs/common';
import type { MailMessage, MailSender } from '@crossmart/common';

/**
 * Base for services that send email without making the caller wait or fail: a slow or broken
 * mail provider must not hold up a request, and timing must not reveal who has an account.
 */
export abstract class BackgroundEmails {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly mail: MailSender) {}

  protected sendInBackground(message: MailMessage): void {
    this.mail.send(message).catch((error: unknown) => {
      this.logger.error(`Could not send "${message.subject}": ${String(error)}`);
    });
  }
}
