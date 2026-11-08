import { AgentScope } from '../../agents/enums/agent-scope.enum.js';
import { z } from 'zod';
import { OrderStatus } from '@crossmart/database/generated/prisma/enums.js';
import { HttpMethod } from '../api/api-call.js';
import { WORKSPACE_PATH } from '../agent-tools.constants.js';
import { defineTool } from './api-tool.js';
import { ID_INPUT, PAGE_INPUT, SEARCH_INPUT } from './tool-inputs.js';

const ORDERS_PATH = `${WORKSPACE_PATH}/orders`;

export const ORDER_TOOLS = [
  defineTool({
    name: 'list_orders',
    title: 'List orders',
    description:
      'Orders from every connected store (Shopify, eBay and others), newest first; each shows ' +
      'its channel. Pass connectionId for one store’s orders, such as the eBay store from ' +
      'list_stores. Orders carry no buyer details, only what was sold, its status and totals.',
    input: {
      status: z.enum(OrderStatus).optional(),
      connectionId: ID_INPUT.optional().describe('Orders of one store, from list_stores'),
      search: SEARCH_INPUT.describe('Matches the order number, such as #1001'),
      ...PAGE_INPUT,
    },
    readOnly: true,
    scope: AgentScope.OrdersRead,
    toCall: (input) => ({ method: HttpMethod.Get, path: ORDERS_PATH, query: input }),
  }),
  defineTool({
    name: 'get_order',
    title: 'Get an order',
    description: 'One order with its lines and the stock each line holds or has shipped.',
    input: { orderId: ID_INPUT },
    readOnly: true,
    scope: AgentScope.OrdersRead,
    toCall: ({ orderId }) => ({ method: HttpMethod.Get, path: `${ORDERS_PATH}/${orderId}` }),
  }),
];
