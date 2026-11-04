import { Module } from '@nestjs/common';
import { AccountEmailsService } from './services/account-emails.service.js';
import { TeamEmailsService } from './services/team-emails.service.js';

/** Email the platform sends to people. Needs the global `MailModule`. */
@Module({
  providers: [AccountEmailsService, TeamEmailsService],
  exports: [AccountEmailsService, TeamEmailsService],
})
export class NotificationsModule {}
