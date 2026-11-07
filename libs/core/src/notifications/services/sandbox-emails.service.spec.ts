import type { MailMessage, MailSender } from '@crossmart/common';
import { SandboxEmailsService } from './sandbox-emails.service.js';

const INPUT = {
  to: 'ana@example.com',
  storeName: 'Ana <Ceramics>',
  url: 'https://app.crossmart.io/claim?token=abc',
  expiresAt: new Date('2026-11-21T10:00:00.000Z'),
};

function setup() {
  const send = vi.fn<MailSender['send']>().mockResolvedValue();
  const service = new SandboxEmailsService({ send } as unknown as MailSender);
  const sent = (): MailMessage => send.mock.calls[0]?.[0] as MailMessage;
  return { service, sent };
}

describe('SandboxEmailsService', () => {
  it('sends the claim link with its expiry, escaping the store name', () => {
    const { service, sent } = setup();
    service.sendClaimLink(INPUT);

    expect(sent().to).toBe('ana@example.com');
    expect(sent().subject).toBe('An AI agent opened a Crossmart account for you');
    expect(sent().html).toContain('Ana &lt;Ceramics&gt;');
    expect(sent().text).toContain('works until November 21, 2026');
    expect(sent().text).toContain('https://app.crossmart.io/claim?token=abc');
  });

  it('says the reminder’s link replaces the first one', () => {
    const { service, sent } = setup();
    service.sendClaimReminder(INPUT);

    expect(sent().subject).toBe('Your Crossmart account is waiting to be claimed');
    expect(sent().text).toContain('This link replaces the one we sent before.');
  });
});
