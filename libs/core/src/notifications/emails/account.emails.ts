import type { MailMessage } from '@crossmart/common';
import { renderEmail } from './email-layout.js';

export interface AccountEmailInput {
  to: string;
  name: string;
  url: string;
}

export function passwordResetEmail({ to, name, url }: AccountEmailInput): MailMessage {
  return renderEmail({
    to,
    subject: 'Reset your Crossmart password',
    heading: 'Reset your password',
    paragraphs: [
      `Hi ${name},`,
      'Someone asked to reset the password of your Crossmart account. The link works for one ' +
        'hour and only once.',
    ],
    action: { label: 'Choose a new password', url },
    footer: 'If it was not you, ignore this email. Your password stays as it is.',
  });
}

export function emailVerificationEmail({ to, name, url }: AccountEmailInput): MailMessage {
  return renderEmail({
    to,
    subject: 'Confirm your email for Crossmart',
    heading: 'Confirm your email',
    paragraphs: [`Hi ${name},`, 'Confirm this address so you can recover your account later.'],
    action: { label: 'Confirm email', url },
    footer: 'If you did not sign up for Crossmart, ignore this email.',
  });
}
