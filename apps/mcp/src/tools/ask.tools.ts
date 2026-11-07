import { z } from 'zod';
import {
  ASK_CALLBACK_URL_MAX_LENGTH,
  ASK_QUESTION_MAX_LENGTH,
  ASK_QUESTION_MIN_LENGTH,
  ASK_TOKEN_MAX_LENGTH,
} from '@crossmart/core/ask/ask.constants.js';
import { AskChannel } from '@crossmart/core/ask/enums/ask-channel.enum.js';
import { HttpMethod } from '../api/api-call.js';
import { ASK_ESCALATIONS_PATH, ASK_PATH } from '../mcp.constants.js';
import { defineTool } from './api-tool.js';

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

export const ASK_TOOLS = [
  defineTool({
    name: 'ask_crossmart',
    title: 'Ask a question about Crossmart',
    description:
      'Answers a question about Crossmart itself (what it does, its plans and limits, and how ' +
      'to use its dashboard, API, SDKs, MCP server and channels) from its public docs, with ' +
      'the pages it used. With this connection’s key or token it can also look up the ' +
      'workspace, read-only, to explain a failed listing, the stores or the plan. Pass the ' +
      'returned conversationId to ask a follow-up. When the docs do not answer, outcome is ' +
      '"unknown" and escalation.offered is true: call again with escalate (and the ' +
      'conversationId) to reach a person, then read the reply with get_ask_escalation. It ' +
      'never changes anything in Crossmart.',
    input: {
      question: z.string().min(ASK_QUESTION_MIN_LENGTH).max(ASK_QUESTION_MAX_LENGTH),
      conversationId: z
        .string()
        .max(ASK_TOKEN_MAX_LENGTH)
        .optional()
        .describe('The conversationId of an earlier answer, for a follow-up'),
      escalate: escalateInput.optional(),
    },
    readOnly: true,
    toCall: ({ question, conversationId, escalate }) =>
      escalate
        ? {
            method: HttpMethod.Post,
            path: ASK_ESCALATIONS_PATH,
            body: { conversationId, ...escalate },
          }
        : {
            method: HttpMethod.Post,
            path: ASK_PATH,
            body: { question, conversationId, channel: AskChannel.Mcp },
          },
  }),
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
