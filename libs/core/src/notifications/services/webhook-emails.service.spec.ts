import type { MailMessage, MailSender } from '@crossmart/common';
import { WebhookEmailsService } from './webhook-emails.service.js';

const INPUT = {
  to: 'ana@example.com',
  workspaceName: 'Mugs <b>& Co</b>',
  endpointUrl: 'https://hooks.example.com/in?a=1&b=<2>',
  failures: 30,
  url: 'https://app.crossmart.io/settings/webhooks',
};

function sentMessage(): MailMessage {
  const send = vi.fn<MailSender['send']>().mockResolvedValue();
  new WebhookEmailsService({ send } as unknown as MailSender).sendEndpointDisabled(INPUT);
  return send.mock.calls[0]?.[0] as MailMessage;
}

describe('WebhookEmailsService.sendEndpointDisabled', () => {
  it('names the workspace and the endpoint, and links to the webhook settings', () => {
    const message = sentMessage();

    expect(message.to).toBe('ana@example.com');
    expect(message.subject).toBe('A webhook endpoint of Mugs <b>& Co</b> was turned off');
    expect(message.text).toContain(
      `30 attempts in a row to deliver events to ${INPUT.endpointUrl}`,
    );
    expect(message.text).toContain(`“${INPUT.workspaceName}” workspace`);
    expect(message.text).toContain(INPUT.url);
    expect(message.html).toContain(`href="${INPUT.url}"`);
  });

  it('escapes the names and URLs users chose in the HTML part', () => {
    const { html } = sentMessage();

    expect(html).toContain('Mugs &lt;b&gt;&amp; Co&lt;/b&gt;');
    expect(html).toContain('https://hooks.example.com/in?a=1&amp;b=&lt;2&gt;');
    expect(html).not.toContain('<b>');
  });
});
