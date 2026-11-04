/** How the API sends email. */
export enum MailDriver {
  /** Writes each email to the log instead of sending it. For development and tests. */
  Log = 'log',
  /** Sends through Resend (resend.com). Needs `RESEND_API_KEY`. */
  Resend = 'resend',
}
