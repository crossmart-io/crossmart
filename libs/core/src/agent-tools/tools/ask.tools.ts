import { z } from 'zod';
import {
  ASK_ESCALATIONS_PER_DAY,
  ASK_QUESTION_MAX_LENGTH,
  ASK_QUESTION_MIN_LENGTH,
  ASK_TOKEN_MAX_LENGTH,
} from '../../ask/ask.constants.js';
import { AskChannel } from '../../ask/enums/ask-channel.enum.js';
import { HttpMethod } from '../api/api-call.js';
import { ASK_ESCALATIONS_PATH, ASK_PATH, AgentToolName } from '../agent-tools.constants.js';
import { type ApiToolSpec, defineTool } from './api-tool.js';

const PATH_SEPARATOR = '/';

const ASK_DESCRIPTION =
  'Answers a question about Crossmart itself (what it does, its plans and limits, and how ' +
  'to use its dashboard, API, SDKs, MCP server and channels) from its public docs, with ' +
  'the pages it used. With this connection’s key or token it can also look up the ' +
  'workspace, read-only, to explain a failed listing, the stores or the plan. Pass the ' +
  'returned conversationId to ask a follow-up. It never changes anything in Crossmart.';
const ESCALATION_HINT =
  ' When the docs do not answer, outcome is "unknown" and escalation.offered is true: if the ' +
  `user wants a person, call ${AgentToolName.EscalateToCrossmartTeam} with the conversationId.`;

const ESCALATE_DESCRIPTION =
  `Hands an ${AgentToolName.AskCrossmart} conversation to a person on the Crossmart team, ` +
  'who get it by email and reply to contactEmail. Only call it when the user asked for a ' +
  'person, usually after an answer offered one (escalation.offered). Read the reply later ' +
  `with ${AgentToolName.GetAskEscalation} and the ticket id it returns. A caller may escalate ` +
  `${ASK_ESCALATIONS_PER_DAY} times a day.`;

const CONVERSATION_ID_INPUT = z.string().max(ASK_TOKEN_MAX_LENGTH);

const QUESTION_INPUT = {
  question: z.string().min(ASK_QUESTION_MIN_LENGTH).max(ASK_QUESTION_MAX_LENGTH),
  conversationId: CONVERSATION_ID_INPUT.optional().describe(
    'The conversationId of an earlier answer, for a follow-up',
  ),
};

/**
 * `ask_crossmart` for a channel: questions and follow-ups only, so it is read-only everywhere.
 * Reaching a person is a separate write tool the MCP server offers; Agent Worker leaves it out
 * and the person contacts the team themselves.
 */
export function askCrossmartTool(channel: AskChannel): ApiToolSpec {
  return defineTool({
    name: AgentToolName.AskCrossmart,
    title: 'Ask a question about Crossmart',
    description:
      channel === AskChannel.Mcp ? `${ASK_DESCRIPTION}${ESCALATION_HINT}` : ASK_DESCRIPTION,
    input: QUESTION_INPUT,
    readOnly: true,
    toCall: (input) => ({ method: HttpMethod.Post, path: ASK_PATH, body: { ...input, channel } }),
  });
}

/**
 * Opens a ticket for the Crossmart team (`POST /api/v1/ask/escalations`). It emails people
 * outside the workspace, so it is open-world. The REST API's `callbackUrl` is left out: the
 * reply reaches the user by email and by `get_ask_escalation`, and an agent-chosen URL would be
 * a way to send the conversation anywhere.
 */
export const ESCALATE_TO_CROSSMART_TEAM_TOOL = defineTool({
  name: AgentToolName.EscalateToCrossmartTeam,
  title: 'Ask the Crossmart team for help',
  description: ESCALATE_DESCRIPTION,
  input: {
    conversationId: CONVERSATION_ID_INPUT.describe('The conversationId ask_crossmart returned'),
    contactEmail: z.email().optional().describe('Where the team should email the reply'),
  },
  readOnly: false,
  openWorld: true,
  toCall: (input) => ({ method: HttpMethod.Post, path: ASK_ESCALATIONS_PATH, body: input }),
});

export const ASK_TOOLS = [
  askCrossmartTool(AskChannel.Mcp),
  ESCALATE_TO_CROSSMART_TEAM_TOOL,
  defineTool({
    name: AgentToolName.GetAskEscalation,
    title: 'Read the reply to an escalated question',
    description:
      'The status of a conversation handed to the Crossmart team with ' +
      `${AgentToolName.EscalateToCrossmartTeam}, and their reply once sent. Takes the ticket id ` +
      'the escalation returned.',
    input: { escalationId: z.string().max(ASK_TOKEN_MAX_LENGTH) },
    readOnly: true,
    toCall: ({ escalationId }) => ({
      method: HttpMethod.Get,
      path: [ASK_ESCALATIONS_PATH, encodeURIComponent(escalationId)].join(PATH_SEPARATOR),
    }),
  }),
];
