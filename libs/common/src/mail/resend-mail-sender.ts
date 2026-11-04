import { RESEND_EMAILS_URL } from './mail.constants.js';
import { type MailMessage, MailSender } from './mail-sender.js';

/** Thrown when Resend refuses an email. The message never contains the API key. */
export class MailDeliveryError extends Error {
  constructor(status: number, detail: string) {
    super(`Resend refused the email (${status}): ${detail}`);
    this.name = 'MailDeliveryError';
  }
}

/** Sends email through Resend's HTTP API. */
export class ResendMailSender extends MailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {
    super();
  }

  async send(message: MailMessage): Promise<void> {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: this.from, ...message }),
    });
    if (!response.ok) throw new MailDeliveryError(response.status, await response.text());
  }
}
