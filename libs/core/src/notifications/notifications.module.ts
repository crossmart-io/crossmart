import { Module } from '@nestjs/common';
import { AccountEmailsService } from './services/account-emails.service.js';
import { TeamEmailsService } from './services/team-emails.service.js';
import { WebhookEmailsService } from './services/webhook-emails.service.js';

/** Email the platform sends to people. Needs the global `MailModule`. */
@Module({
  providers: [AccountEmailsService, TeamEmailsService, WebhookEmailsService],
  exports: [AccountEmailsService, TeamEmailsService, WebhookEmailsService],
})
export class NotificationsModule {}
