import type { AppConfigService } from '@crossmart/common';
import type { SandboxEmailsService } from '../../notifications/services/sandbox-emails.service.js';
import { SandboxClaimMailer } from './sandbox-claim.mailer.js';

const LINK = {
  email: 'ana@example.com',
  storeName: 'Ana Ceramics',
  token: 'tok en/1',
  expiresAt: new Date('2026-11-21T10:00:00.000Z'),
};

function setup() {
  const emails = {
    sendClaimLink: vi.fn<SandboxEmailsService['sendClaimLink']>(),
    sendClaimReminder: vi.fn<SandboxEmailsService['sendClaimReminder']>(),
  };
  const appConfig = { webAppUrl: 'https://app.crossmart.io' } as AppConfigService;
  const mailer = new SandboxClaimMailer(appConfig, emails as unknown as SandboxEmailsService);
  return { mailer, emails };
}

describe('SandboxClaimMailer', () => {
  it('links to the web app’s claim page with the token in the query', () => {
    const { mailer, emails } = setup();
    mailer.sendClaimLink(LINK);

    expect(emails.sendClaimLink).toHaveBeenCalledWith({
      to: 'ana@example.com',
      storeName: 'Ana Ceramics',
      url: 'https://app.crossmart.io/claim?token=tok+en%2F1',
      expiresAt: LINK.expiresAt,
    });
  });

  it('sends the reminder through its own email', () => {
    const { mailer, emails } = setup();
    mailer.sendReminder(LINK);
    expect(emails.sendClaimReminder).toHaveBeenCalledTimes(1);
    expect(emails.sendClaimLink).not.toHaveBeenCalled();
  });
});
