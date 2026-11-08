import { z } from 'zod';
import { SandboxOpeningOutcome } from '../../sandbox/enums/sandbox-opening-outcome.enum.js';
import { HttpMethod } from '../api/api-call.js';
import { apiKeyCredential } from '../api/api-credential.js';
import type { CrossmartApiClient } from '../api/crossmart-api-client.js';
import {
  EMAIL_MAX_LENGTH,
  SANDBOX_ACCOUNTS_PATH,
  STORE_NAME_MAX_LENGTH,
} from '../agent-tools.constants.js';
import { defineTool } from './api-tool.js';

/** The part of `create_account`'s answer that carries the new workspace's key. */
const OPENED_ACCOUNT = z.object({
  outcome: z.literal(SandboxOpeningOutcome.Created),
  apiKey: z.string(),
});

/** A local server started without a key works in the account it just opened from then on. */
function useOpenedAccount(result: unknown, client: CrossmartApiClient): void {
  const opened = OPENED_ACCOUNT.safeParse(result);
  if (opened.success) client.adoptCredential(apiKeyCredential(opened.data.apiKey));
}

/** Tools offered only before the agent has a credential (ADR 0019). */
export const ANONYMOUS_TOOLS = [
  defineTool({
    name: 'create_account',
    title: 'Open a Crossmart account for the user',
    description:
      'Opens a Crossmart account for a user who has none yet, so you can start on their ' +
      'catalog at once. Only call it when the user asked you to set Crossmart up for them, with ' +
      'their own email. It returns an API key (use it as "Authorization: Bearer <key>"; this ' +
      'server starts using it by itself when it was started without one) and emails the user a ' +
      'link to claim the account. Until they claim it, it is a sandbox: products (up to 100), ' +
      'stock and drafts work; connecting stores, publishing, inviting people and Crossmart AI ' +
      'are refused with sandbox_claim_required, and an unclaimed account is deleted after 14 ' +
      'days. outcome "sign_in_required" means nothing was opened: ask the user to sign in and ' +
      'connect you through OAuth instead. Follow nextStep in the answer.',
    input: {
      email: z.email().max(EMAIL_MAX_LENGTH).describe('The user’s own email address'),
      storeName: z
        .string()
        .min(1)
        .max(STORE_NAME_MAX_LENGTH)
        .describe('What to call their store, such as their brand'),
    },
    readOnly: false,
    toCall: (input) => ({ method: HttpMethod.Post, path: SANDBOX_ACCOUNTS_PATH, body: input }),
    afterCall: useOpenedAccount,
  }),
];
