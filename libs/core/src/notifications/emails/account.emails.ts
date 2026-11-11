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

/**
 * What a new seller does after confirming, sent with the confirmation (the email they get on
 * signing up), so someone who signed up through an AI agent knows where to go next.
 */
const GETTING_STARTED_PARAGRAPHS = [
  'Then, to get your products selling:',
  '1. Add your products in the Crossmart app, or ask your AI agent to draft them for you. ' +
    'No store is needed yet.',
  '2. Connect a store, such as Shopify or eBay, from the Stores page.',
  '3. Publish your products to it. Crossmart keeps their stock in sync from then on.',
];

export function emailVerificationEmail({ to, name, url }: AccountEmailInput): MailMessage {
  return renderEmail({
    to,
    subject: 'Confirm your email for Crossmart',
    heading: 'Confirm your email',
    paragraphs: [
      `Hi ${name},`,
      'Confirm this address so you can recover your account later.',
      ...GETTING_STARTED_PARAGRAPHS,
    ],
    action: { label: 'Confirm email', url },
    footer: 'If you did not sign up for Crossmart, ignore this email.',
  });
}
