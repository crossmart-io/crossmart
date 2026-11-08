import { z } from 'zod';
import {
  ASK_CALLBACK_URL_MAX_LENGTH,
  ASK_QUESTION_MAX_LENGTH,
  ASK_QUESTION_MIN_LENGTH,
  ASK_TOKEN_MAX_LENGTH,
} from '../../ask/ask.constants.js';
import { AskChannel } from '../../ask/enums/ask-channel.enum.js';
import { HttpMethod } from '../api/api-call.js';
import { ASK_ESCALATIONS_PATH, ASK_PATH, AgentToolName } from '../agent-tools.constants.js';
import { type ApiToolSpec, defineTool } from './api-tool.js';

const PATH_SEPARATOR = '/';

const escalateInput = z
  .object({
    contactEmail: z.email().optional().describe('Where the team should email the reply'),
    callbackUrl: z
      .url()
      .max(ASK_CALLBACK_URL_MAX_LENGTH)
      .optional()
      .describe('A public https URL the signed reply is POSTed to'),
  })
  .describe(
    'Hand the conversation to a person from the Crossmart team instead of asking. Needs ' +
      'conversationId. Use it when the answer offers a person (escalation.offered) and the ' +
      'user wants one.',
  );

const ASK_DESCRIPTION =
  'Answers a question about Crossmart itself (what it does, its plans and limits, and how ' +
  'to use its dashboard, API, SDKs, MCP server and channels) from its public docs, with ' +
  'the pages it used. With this connection’s key or token it can also look up the ' +
  'workspace, read-only, to explain a failed listing, the stores or the plan. Pass the ' +
  'returned conversationId to ask a follow-up. It never changes anything in Crossmart.';
const ESCALATION_DESCRIPTION =
  ' When the docs do not answer, outcome is "unknown" and escalation.offered is true: call ' +
  'again with escalate (and the conversationId) to reach a person, then read the reply with ' +
  'get_ask_escalation.';

const QUESTION_INPUT = {
  question: z.string().min(ASK_QUESTION_MIN_LENGTH).max(ASK_QUESTION_MAX_LENGTH),
  conversationId: z
    .string()
    .max(ASK_TOKEN_MAX_LENGTH)
    .optional()
    .describe('The conversationId of an earlier answer, for a follow-up'),
};

/**
 * `ask_crossmart` for a channel. The MCP server's version can also escalate to a person;
 * Agent Worker's only asks, so it stays read-only and the person contacts the team themselves.
 */
export function askCrossmartTool(channel: AskChannel, canEscalate: boolean): ApiToolSpec {
  if (!canEscalate) {
    return defineTool({
      name: AgentToolName.AskCrossmart,
      title: 'Ask a question about Crossmart',
      description: ASK_DESCRIPTION,
      input: QUESTION_INPUT,
      readOnly: true,
      toCall: (input) => ({ method: HttpMethod.Post, path: ASK_PATH, body: { ...input, channel } }),
    });
  }
  return defineTool({
    name: AgentToolName.AskCrossmart,
    title: 'Ask a question about Crossmart',
    description: `${ASK_DESCRIPTION}${ESCALATION_DESCRIPTION}`,
    input: { ...QUESTION_INPUT, escalate: escalateInput.optional() },
    readOnly: true,
    toCall: ({ question, conversationId, escalate }) =>
      escalate
        ? {
            method: HttpMethod.Post,
            path: ASK_ESCALATIONS_PATH,
            body: { conversationId, ...escalate },
          }
        : { method: HttpMethod.Post, path: ASK_PATH, body: { question, conversationId, channel } },
  });
}

export const ASK_TOOLS = [
  askCrossmartTool(AskChannel.Mcp, true),
  defineTool({
    name: 'get_ask_escalation',
    title: 'Read the reply to an escalated question',
    description:
      'The status of a conversation handed to the Crossmart team with ask_crossmart’s ' +
      'escalate, and their reply once sent. Takes the ticket id the escalation returned.',
    input: { escalationId: z.string().max(ASK_TOKEN_MAX_LENGTH) },
    readOnly: true,
    toCall: ({ escalationId }) => ({
      method: HttpMethod.Get,
      path: [ASK_ESCALATIONS_PATH, encodeURIComponent(escalationId)].join(PATH_SEPARATOR),
    }),
  }),
];
