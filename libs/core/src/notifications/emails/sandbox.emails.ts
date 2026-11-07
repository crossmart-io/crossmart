import type { MailMessage } from '@crossmart/common';
import { renderEmail } from './email-layout.js';

export interface SandboxClaimEmailInput {
  to: string;
  storeName: string;
  url: string;
  /** When the link stops working and the account is deleted. */
  expiresAt: Date;
}

/** Dates in these emails read the same for everyone: "November 21, 2026". */
const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

const CLAIM_ACTION_LABEL = 'Claim your account';

function claimTerms(expiresOn: string): string {
  return (
    'Claim it to keep what the agent builds, connect your stores and publish. Until then it ' +
    `cannot sell anywhere. The link works until ${expiresOn}; after that the account and ` +
    'everything in it is deleted.'
  );
}

function ignoreFooter(expiresOn: string): string {
  return (
    'If you did not ask an AI agent to do this, ignore this email. Nothing is published, and ' +
    `the account is deleted on ${expiresOn}.`
  );
}

/** The first email: an AI agent opened an account for this address (ADR 0019). */
export function sandboxClaimEmail({
  to,
  storeName,
  url,
  expiresAt,
}: SandboxClaimEmailInput): MailMessage {
  const expiresOn = DATE_FORMAT.format(expiresAt);
  return renderEmail({
    to,
    subject: 'An AI agent opened a Crossmart account for you',
    heading: 'Claim your Crossmart account',
    paragraphs: [
      `An AI agent you work with opened a Crossmart account for “${storeName}” with this ` +
        'address, so it can start on your catalog.',
      claimTerms(expiresOn),
    ],
    action: { label: CLAIM_ACTION_LABEL, url },
    footer: ignoreFooter(expiresOn),
  });
}

/** The one reminder, sent while the account is still unclaimed. Its link replaces the first. */
export function sandboxClaimReminderEmail(input: SandboxClaimEmailInput): MailMessage {
  const { to, storeName, url, expiresAt } = input;
  const expiresOn = DATE_FORMAT.format(expiresAt);
  return renderEmail({
    to,
    subject: 'Your Crossmart account is waiting to be claimed',
    heading: 'Your Crossmart account is not claimed yet',
    paragraphs: [
      `The Crossmart account an AI agent opened for “${storeName}” is still waiting for you. ` +
        'This link replaces the one we sent before.',
      claimTerms(expiresOn),
    ],
    action: { label: CLAIM_ACTION_LABEL, url },
    footer: ignoreFooter(expiresOn),
  });
}
