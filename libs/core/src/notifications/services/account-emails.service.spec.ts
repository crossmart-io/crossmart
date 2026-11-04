import type { MailMessage, MailSender } from '@crossmart/common';
import { AccountEmailsService } from './account-emails.service.js';

function setup(send = vi.fn<MailSender['send']>().mockResolvedValue()) {
  return { send, service: new AccountEmailsService({ send } as unknown as MailSender) };
}

const sent = (send: ReturnType<typeof vi.fn<MailSender['send']>>): MailMessage =>
  send.mock.calls[0]?.[0] as MailMessage;

describe('AccountEmailsService', () => {
  it('sends a reset link, escaping the name in the HTML part', () => {
    const { send, service } = setup();
    service.sendPasswordReset({
      to: 'ana@example.com',
      name: 'Ana <b>',
      url: 'https://api.crossmart.io/api/auth/reset-password/abc?callbackURL=x&y=1',
    });
    const message = sent(send);
    expect(message.to).toBe('ana@example.com');
    expect(message.subject).toBe('Reset your Crossmart password');
    expect(message.html).toContain('Ana &lt;b&gt;');
    expect(message.html).toContain('callbackURL=x&amp;y=1');
    expect(message.text).toContain('https://api.crossmart.io/api/auth/reset-password/abc');
  });

  it('never fails the caller when sending fails', async () => {
    const { send, service } = setup(
      vi.fn<MailSender['send']>().mockRejectedValue(new Error('down')),
    );
    expect(() =>
      service.sendEmailVerification({ to: 'a@b.c', name: 'A', url: 'https://x.y/z' }),
    ).not.toThrow();
    await vi.waitFor(() => expect(send).toHaveBeenCalled());
  });
});
