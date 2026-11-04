import { Logger } from '@nestjs/common';
import { type MailMessage, MailSender } from './mail-sender.js';

/**
 * Writes emails to the log instead of sending them, so a developer can follow the links. With
 * `withBody` off (production) it logs only that an email was not sent: the links in emails
 * sign people in, and logs are read by more people than the inbox.
 */
export class LogMailSender extends MailSender {
  private readonly logger = new Logger(LogMailSender.name);

  constructor(private readonly withBody: boolean) {
    super();
  }

  send(message: MailMessage): Promise<void> {
    if (this.withBody) {
      this.logger.log(`Email to ${message.to}: ${message.subject}\n${message.text}`);
    } else {
      this.logger.warn(`Email "${message.subject}" not sent: set MAIL_DRIVER=resend to send email`);
    }
    return Promise.resolve();
  }
}
