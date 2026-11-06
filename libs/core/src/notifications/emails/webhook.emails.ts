import type { MailMessage } from '@crossmart/common';
import { renderEmail } from './email-layout.js';

export interface WebhookEndpointDisabledEmailInput {
  to: string;
  workspaceName: string;
  endpointUrl: string;
  failures: number;
  /** The webhook settings page. */
  url: string;
}

export function webhookEndpointDisabledEmail(
  input: WebhookEndpointDisabledEmailInput,
): MailMessage {
  const { to, workspaceName, endpointUrl, failures, url } = input;
  return renderEmail({
    to,
    subject: `A webhook endpoint of ${workspaceName} was turned off`,
    heading: 'A webhook endpoint was turned off',
    paragraphs: [
      `${failures} attempts in a row to deliver events to ${endpointUrl} failed, so Crossmart ` +
        `stopped sending them to this endpoint of the “${workspaceName}” workspace.`,
      'Fix the endpoint, send it a test event, then turn it back on. Events from while it was ' +
        'off can be sent again from its delivery log.',
    ],
    action: { label: 'Open webhook settings', url },
    footer: 'You receive this because you manage webhooks in this workspace.',
  });
}
