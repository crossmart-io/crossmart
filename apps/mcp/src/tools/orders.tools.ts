import { AgentScope } from '@crossmart/core/agents/enums/agent-scope.enum.js';
import { z } from 'zod';
import { OrderStatus } from '@crossmart/database/generated/prisma/enums.js';
import { HttpMethod } from '../api/api-call.js';
import { WORKSPACE_PATH } from '../mcp.constants.js';
import { defineTool } from './api-tool.js';
import { ID_INPUT, PAGE_INPUT, SEARCH_INPUT } from './tool-inputs.js';

const ORDERS_PATH = `${WORKSPACE_PATH}/orders`;

export const ORDER_TOOLS = [
  defineTool({
    name: 'list_orders',
    title: 'List orders',
    description:
      'Orders from every connected store, newest first. Orders carry no buyer details, only ' +
      'what was sold, its status and totals.',
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
