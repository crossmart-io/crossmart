import { AgentScope } from '../../agents/enums/agent-scope.enum.js';
import { z } from 'zod';
import { SuggestionStatus } from '@crossmart/database/generated/prisma/enums.js';
import { HttpMethod } from '../api/api-call.js';
import { CONTENT_GENERATION_MAX_PRODUCTS, WORKSPACE_PATH } from '../agent-tools.constants.js';
import { defineTool } from './api-tool.js';
import { ID_INPUT, PAGE_INPUT } from './tool-inputs.js';

const SUGGESTIONS_PATH = `${WORKSPACE_PATH}/suggestions`;
const CONTENT_GENERATIONS_PATH = `${WORKSPACE_PATH}/ai/content-generations`;

export const SUGGESTION_TOOLS = [
  defineTool({
    name: 'generate_content',
    title: 'Generate listing content with AI',
    description:
      'Ask Crossmart’s Content Generator to write a channel-optimised title and description ' +
      'for products on one store. It runs in the background and nothing changes yet: the ' +
      'results arrive as pending suggestions (see list_suggestions), which someone with ' +
      'approval rights must approve.',
    input: {
      connectionId: ID_INPUT.describe('The store to write for, from list_stores'),
      productIds: z.array(ID_INPUT).min(1).max(CONTENT_GENERATION_MAX_PRODUCTS),
    },
    readOnly: false,
    scope: AgentScope.SuggestionsWrite,
    toCall: (input) => ({
      method: HttpMethod.Post,
      path: CONTENT_GENERATIONS_PATH,
      body: input,
    }),
  }),
  defineTool({
    name: 'list_suggestions',
    title: 'List suggestions',
    description:
      'Proposed changes waiting for review (status PENDING), or past ones, newest first. Each ' +
      'shows the current value, the proposed value and why.',
    input: {
      status: z.enum(SuggestionStatus).optional().describe('PENDING lists what needs review'),
      productId: ID_INPUT.optional(),
      connectionId: ID_INPUT.optional().describe('Suggestions for one store, from list_stores'),
      ...PAGE_INPUT,
    },
    readOnly: true,
    scope: AgentScope.CatalogRead,
    toCall: (input) => ({ method: HttpMethod.Get, path: SUGGESTIONS_PATH, query: input }),
  }),
  defineTool({
    name: 'approve_suggestion',
    title: 'Approve a suggestion',
    description:
      'Apply a pending suggestion: the store’s listing changes and is synced. If the field ' +
      'changed since the suggestion was made, nothing is applied and it comes back STALE. ' +
      'Needs the suggestions:approve permission; ask the merchant before approving.',
    input: { suggestionId: ID_INPUT.describe('From list_suggestions') },
    readOnly: false,
    scope: AgentScope.SuggestionsWrite,
    toCall: ({ suggestionId }) => ({
      method: HttpMethod.Post,
      path: `${SUGGESTIONS_PATH}/${suggestionId}/approve`,
    }),
  }),
];
