import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service.js';
import { LogMailSender } from './log-mail-sender.js';
import { MailDriver } from './mail-driver.enum.js';
import { MailSender } from './mail-sender.js';
import { ResendMailSender } from './resend-mail-sender.js';

function createMailSender(appConfig: AppConfigService): MailSender {
  const { driver, resendApiKey, from } = appConfig.mailSettings;
  switch (driver) {
    case MailDriver.Log:
      return new LogMailSender(!appConfig.isProduction);
    case MailDriver.Resend:
      return new ResendMailSender(resendApiKey, from);
  }
}

/** Provides the configured `MailSender`. */
@Global()
@Module({
  providers: [{ provide: MailSender, useFactory: createMailSender, inject: [AppConfigService] }],
  exports: [MailSender],
})
export class MailModule {}
