import { Module } from '@nestjs/common';
import { AccountEmailsService } from './services/account-emails.service.js';
import { AskEmailsService } from './services/ask-emails.service.js';
import { SandboxEmailsService } from './services/sandbox-emails.service.js';
import { TeamEmailsService } from './services/team-emails.service.js';
import { WebhookEmailsService } from './services/webhook-emails.service.js';

/** Email the platform sends to people. Needs the global `MailModule`. */
@Module({
  providers: [
    AccountEmailsService,
    AskEmailsService,
    SandboxEmailsService,
    TeamEmailsService,
    WebhookEmailsService,
  ],
  exports: [
    AccountEmailsService,
    AskEmailsService,
    SandboxEmailsService,
    TeamEmailsService,
    WebhookEmailsService,
  ],
})
export class NotificationsModule {}
