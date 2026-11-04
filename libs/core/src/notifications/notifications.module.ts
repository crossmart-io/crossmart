import { Module } from '@nestjs/common';
import { AccountEmailsService } from './services/account-emails.service.js';

/** Email the platform sends to people. Needs the global `MailModule`. */
@Module({
  providers: [AccountEmailsService],
  exports: [AccountEmailsService],
})
export class NotificationsModule {}
