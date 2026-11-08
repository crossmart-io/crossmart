import { MS_PER_DAY, MS_PER_HOUR } from '@crossmart/common';
import { AGENT_PROPOSAL_TTL_DAYS } from './agent-proposal-ttl.js';

export { AGENT_PROPOSAL_TTL_DAYS };
export const AGENT_PROPOSAL_TTL_MS = AGENT_PROPOSAL_TTL_DAYS * MS_PER_DAY;

/** Characters of the API's answer kept once an approved change ran. */
export const AGENT_PROPOSAL_RESULT_MAX_LENGTH = 4_000;

/** Proposals listed per page. */
export const AGENT_PROPOSAL_DEFAULT_PAGE_SIZE = 20;
export const AGENT_PROPOSAL_MAX_PAGE_SIZE = 50;

/** The worker marks proposals past their expiry hourly, in batches. */
export const AGENT_PROPOSAL_EXPIRY_INTERVAL_MS = MS_PER_HOUR;
export const AGENT_PROPOSAL_EXPIRY_JOB_NAME = 'agent-proposal-expiry';
export const AGENT_PROPOSAL_EXPIRY_SCHEDULER_ID = 'agent-proposal-expiry';
export const AGENT_PROPOSAL_EXPIRY_BATCH_SIZE = 500;
export const AGENT_PROPOSAL_EXPIRY_MAX_BATCHES = 20;

/**
 * The header carrying the credential the API uses to apply an approved proposal as its agent.
 * Only the API mints it, it names one proposal, and it is accepted only from a loopback address.
 */
export const AGENT_PROPOSAL_TOKEN_HEADER = 'x-crossmart-agent-proposal';
export const AGENT_PROPOSAL_TOKEN_TTL_SECONDS = 120;
export const AGENT_PROPOSAL_TOKEN_AUDIENCE = 'crossmart:agent-proposal';
export const AGENT_PROPOSAL_TOKEN_ISSUER = 'crossmart-api';
/** What the token's signing key is derived for, so it is good for nothing else. */
export const AGENT_PROPOSAL_TOKEN_KEY_CONTEXT = 'crossmart:agent-proposal-token:v1';
/** The token's claims; its subject is the person who approved. */
export const AGENT_PROPOSAL_WORKSPACE_CLAIM = 'wid';
export const AGENT_PROPOSAL_ID_CLAIM = 'pid';

/** Messages the API returns. */
export const AGENT_PROPOSAL_COPY = {
  notFound: 'Proposal not found',
  notPending: 'This proposal is no longer waiting for a decision',
  highRiskNotConfirmed:
    'This deletes something, changes prices or touches many items. Confirm it explicitly to go on.',
  unknownTool: (tool: string) =>
    `${tool} is not a change that waits for approval. Call read tools directly.`,
  invalidInput: (where: string) => `The input does not match the tool's schema at ${where}.`,
  outOfScope: (tool: string) => `This connection is not allowed to use ${tool}.`,
  reviewerLacksPermission:
    'You do not have the permission this change needs, so you cannot approve it.',
  applyDirectly: 'This workspace lets outside agents make changes directly. Make the call itself.',
  proposerGone:
    'The agent that proposed this is no longer connected, or its key was revoked, so the change was not made.',
  toolGone: 'This tool is no longer available, so the change was not made.',
  unreachable: 'Crossmart could not make the change. Try approving it again later.',
  onlyAgents: 'Only agents and API keys propose changes; people make them directly.',
} as const;

/** Joins the parts of an invalid input's paths. */
export const INPUT_PATH_SEPARATOR = '.';
export const INPUT_ISSUE_SEPARATOR = ', ';
export const INPUT_ROOT_PATH = '(input)';
