import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import type { SandboxClaimEmailInput } from '../../notifications/emails/sandbox.emails.js';
import { SandboxEmailsService } from '../../notifications/services/sandbox-emails.service.js';
import { SANDBOX_CLAIM_PATH, SANDBOX_CLAIM_TOKEN_QUERY } from '../sandbox.constants.js';

/** Who a claim email goes to, the store it is about, its token and when the link stops working. */
export interface SandboxClaimLink {
  email: string;
  storeName: string;
  token: string;
  expiresAt: Date;
}

/** Emails a sandbox account's claim link, which opens the web app's claim page. */
@Injectable()
export class SandboxClaimMailer {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly emails: SandboxEmailsService,
  ) {}

  sendClaimLink(link: SandboxClaimLink): void {
    this.emails.sendClaimLink(this.toEmail(link));
  }

  sendReminder(link: SandboxClaimLink): void {
    this.emails.sendClaimReminder(this.toEmail(link));
  }

  private toEmail({
    email,
    storeName,
    token,
    expiresAt,
  }: SandboxClaimLink): SandboxClaimEmailInput {
    const url = new URL(SANDBOX_CLAIM_PATH, this.appConfig.webAppUrl);
    url.searchParams.set(SANDBOX_CLAIM_TOKEN_QUERY, token);
    return { to: email, storeName, url: url.toString(), expiresAt };
  }
}
