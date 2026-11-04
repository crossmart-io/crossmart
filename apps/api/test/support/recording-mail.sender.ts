import { type MailMessage, MailSender } from '@crossmart/common';

/** Keeps every email instead of sending it, so tests can follow the links. */
export class RecordingMailSender extends MailSender {
  readonly sent: MailMessage[] = [];

  send(message: MailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }

  /** The last email to an address, waiting briefly because emails go out in the background. */
  async lastTo(address: string): Promise<MailMessage> {
    await vi.waitFor(() => {
      if (!this.sent.some((message) => message.to === address)) {
        throw new Error(`No email to ${address} yet`);
      }
    });
    return this.sent.filter((message) => message.to === address).at(-1) as MailMessage;
  }
}

/** The first link in an email's text that starts with `prefix`. */
export function linkIn(message: MailMessage, prefix: string): URL {
  const match = message.text.match(
    new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\S+`),
  );
  if (!match) throw new Error(`No ${prefix} link in "${message.subject}"`);
  return new URL(match[0]);
}
