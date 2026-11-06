import { z } from 'zod';
import { AgentScope } from '@crossmart/core/agents/enums/agent-scope.enum.js';
import { SalesRange } from '@crossmart/core/analytics/enums/sales-range.enum.js';
import { HttpMethod } from '../api/api-call.js';
import { API_HEALTH_PATH, WORKSPACE_PATH } from '../mcp.constants.js';
import { defineTool } from './api-tool.js';

export const REPORT_TOOLS = [
  defineTool({
    name: 'get_sales_report',
    title: 'Get the sales report',
    description:
      'Sales, orders, average order value and units for a period, against the period before, ' +
      'with sales per day, week or month, per store, and the top products.',
    input: {
      range: z.enum(SalesRange).optional(),
      timeZone: z.string().optional().describe('IANA zone the days follow, such as Europe/Paris'),
    },
    readOnly: true,
    scope: AgentScope.ReportsRead,
    toCall: (input) => ({
      method: HttpMethod.Get,
      path: `${WORKSPACE_PATH}/analytics/sales`,
      query: input,
    }),
  }),
  defineTool({
    name: 'get_inventory_report',
    title: 'Get the inventory report',
    description:
      'Stock value at cost and at price, variants low or out of stock (and the ones lowest on ' +
      'stock), and each store’s listings by status, as of now.',
    input: {},
    readOnly: true,
    scope: AgentScope.ReportsRead,
    toCall: () => ({ method: HttpMethod.Get, path: `${WORKSPACE_PATH}/analytics/inventory` }),
  }),
  defineTool({
    name: 'get_listing_health_report',
    title: 'Get the listing health report',
    description:
      'Each store’s products by display state (draft, needs_details, ready, publishing, ' +
      'published, failed, removing, removed) and the latest listings a channel refused, each ' +
      'with its reason and the requirement to fix, as of now.',
    input: {},
    readOnly: true,
    scope: AgentScope.ReportsRead,
    toCall: () => ({ method: HttpMethod.Get, path: `${WORKSPACE_PATH}/analytics/listings` }),
  }),
  defineTool({
    name: 'get_platform_health',
    title: 'Get platform health',
    description: 'Check that the Crossmart API and its database are reachable.',
    input: {},
    readOnly: true,
    toCall: () => ({ method: HttpMethod.Get, path: API_HEALTH_PATH }),
  }),
];
