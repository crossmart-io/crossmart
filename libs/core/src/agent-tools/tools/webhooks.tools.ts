import { z } from 'zod';
import { AgentScope } from '../../agents/enums/agent-scope.enum.js';
import { WebhookEventType } from '../../webhooks/enums/webhook-event-type.enum.js';
import {
  WEBHOOK_DESCRIPTION_MAX_LENGTH,
  WEBHOOK_URL_MAX_LENGTH,
} from '../../webhooks/webhooks.constants.js';
import { HttpMethod } from '../api/api-call.js';
import { WORKSPACE_PATH } from '../agent-tools.constants.js';
import { defineTool } from './api-tool.js';

const WEBHOOK_ENDPOINTS_PATH = `${WORKSPACE_PATH}/webhook-endpoints`;
/** Every event type but the test event, which only "send test" sends. */
const SUBSCRIBABLE_EVENT_TYPE = z
  .enum(WebhookEventType)
  .refine((type) => type !== WebhookEventType.Test, 'webhook.test cannot be subscribed to');

export const WEBHOOK_TOOLS = [
  defineTool({
    name: 'list_webhook_endpoints',
    title: 'List webhook endpoints',
    description:
      'The URLs this workspace sends events to (orders, stock, listings, products), with the ' +
      'events each receives and whether it is on. Secrets are never shown.',
    input: {},
    readOnly: true,
    scope: AgentScope.WebhooksWrite,
    toCall: () => ({ method: HttpMethod.Get, path: WEBHOOK_ENDPOINTS_PATH }),
  }),
  defineTool({
    name: 'create_webhook_endpoint',
    title: 'Add a webhook endpoint',
    description:
      'Have Crossmart POST events to a URL as they happen, instead of polling: new and changed ' +
      'orders, stock changes, listings published, failed or removed, and product changes. The ' +
      'URL must be public https. The answer holds the signing secret, shown only this once: ' +
      'give it to the service behind the URL, which verifies the Crossmart-Signature header ' +
      'with it. Only add a URL the merchant asked for: events carry their store data there.',
    input: {
      url: z.url().max(WEBHOOK_URL_MAX_LENGTH),
      eventTypes: z.array(SUBSCRIBABLE_EVENT_TYPE).min(1),
      description: z.string().max(WEBHOOK_DESCRIPTION_MAX_LENGTH).optional(),
    },
    readOnly: false,
    scope: AgentScope.WebhooksWrite,
    toCall: (input) => ({ method: HttpMethod.Post, path: WEBHOOK_ENDPOINTS_PATH, body: input }),
  }),
];
