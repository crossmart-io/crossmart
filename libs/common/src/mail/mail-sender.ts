export interface MailMessage {
  to: string;
  subject: string;
  /** The HTML part. Every value in it must already be escaped. */
  html: string;
  /** The plain-text part, for clients that do not show HTML. */
  text: string;
}

/** Sends transactional email: password resets, email checks, invitations. */
export abstract class MailSender {
  abstract send(message: MailMessage): Promise<void>;
}
