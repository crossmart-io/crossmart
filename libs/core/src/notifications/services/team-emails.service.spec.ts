import type { MailMessage, MailSender } from '@crossmart/common';
import { TeamEmailsService } from './team-emails.service.js';

describe('TeamEmailsService', () => {
  it('sends the invitation link, escaping names chosen by users', () => {
    const send = vi.fn<MailSender['send']>().mockResolvedValue();
    new TeamEmailsService({ send } as unknown as MailSender).sendWorkspaceInvitation({
      to: 'bo@example.com',
      inviterName: 'Ana',
      workspaceName: 'Shop <i>',
      roleName: 'Editor',
      url: 'https://app.crossmart.io/invitations/accept?token=abc',
      expiresInDays: 7,
    });
    const message = send.mock.calls[0]?.[0] as MailMessage;
    expect(message.to).toBe('bo@example.com');
    expect(message.subject).toBe('Ana invited you to Crossmart');
    expect(message.html).toContain('Shop &lt;i&gt;');
    expect(message.text).toContain('with the Editor role');
    expect(message.text).toContain('works for 7 days');
    expect(message.text).toContain('https://app.crossmart.io/invitations/accept?token=abc');
  });
});
