import { Injectable } from '@nestjs/common';
import { MailSender } from '@crossmart/common';
import {
  type WebhookEndpointDisabledEmailInput,
  webhookEndpointDisabledEmail,
} from '../emails/webhook.emails.js';
import { BackgroundEmails } from './background-emails.js';

/** Sends the emails about a workspace's webhook endpoints. */
@Injectable()
export class WebhookEmailsService extends BackgroundEmails {
  constructor(mail: MailSender) {
    super(mail);
  }

  sendEndpointDisabled(input: WebhookEndpointDisabledEmailInput): void {
    this.sendInBackground(webhookEndpointDisabledEmail(input));
  }
}
