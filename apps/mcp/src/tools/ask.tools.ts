import { z } from 'zod';
import {
  ASK_QUESTION_MAX_LENGTH,
  ASK_QUESTION_MIN_LENGTH,
} from '@crossmart/core/ask/ask.constants.js';
import { HttpMethod } from '../api/api-call.js';
import { ASK_PATH } from '../mcp.constants.js';
import { defineTool } from './api-tool.js';

export const ASK_TOOLS = [
  defineTool({
    name: 'ask_crossmart',
    title: 'Ask a question about Crossmart',
    description:
      'Answers a question about Crossmart itself (what it does, its plans and limits, and how ' +
      'to use its dashboard, API, SDKs, MCP server and channels) from its public docs, with ' +
      'the pages it used. It never sees the seller’s data: use the other tools for that. When ' +
      'the docs do not answer, outcome is "unknown" and it gives the support address. It ' +
      'changes nothing.',
    input: {
      question: z.string().min(ASK_QUESTION_MIN_LENGTH).max(ASK_QUESTION_MAX_LENGTH),
    },
    readOnly: true,
    toCall: (input) => ({ method: HttpMethod.Post, path: ASK_PATH, body: input }),
  }),
];
