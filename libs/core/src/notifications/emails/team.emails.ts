import type { MailMessage } from '@crossmart/common';
import { renderEmail } from './email-layout.js';

export interface WorkspaceInvitationEmailInput {
  to: string;
  inviterName: string;
  workspaceName: string;
  roleName: string;
  url: string;
  expiresInDays: number;
}

export function workspaceInvitationEmail(input: WorkspaceInvitationEmailInput): MailMessage {
  const { to, inviterName, workspaceName, roleName, url, expiresInDays } = input;
  return renderEmail({
    to,
    subject: `${inviterName} invited you to ${workspaceName} on Crossmart`,
    heading: `Join ${workspaceName} on Crossmart`,
    paragraphs: [
      `${inviterName} invited you to the ${workspaceName} workspace with the ${roleName} role.`,
      `Sign in or create an account with this address to accept. The link works for ` +
        `${expiresInDays} days.`,
    ],
    action: { label: 'Accept invitation', url },
    footer: 'If you did not expect this invitation, ignore this email.',
  });
}
