import { AgentScope } from '@crossmart/core/agents/enums/agent-scope.enum.js';
import { z } from 'zod';
import { StockAdjustmentMode } from '@crossmart/core/inventory/enums/stock-adjustment-mode.enum.js';
import { StockLevel } from '@crossmart/core/inventory/enums/stock-level.enum.js';
import { MANUAL_MOVEMENT_REASONS } from '@crossmart/core/inventory/inventory.constants.js';
import { HttpMethod } from '../api/api-call.js';
import { NOTE_MAX_LENGTH, WORKSPACE_PATH } from '../mcp.constants.js';
import { defineTool } from './api-tool.js';
import { ID_INPUT, PAGE_INPUT, SEARCH_INPUT } from './tool-inputs.js';

const INVENTORY_PATH = `${WORKSPACE_PATH}/inventory-items`;
const [FIRST_REASON, ...OTHER_REASONS] = MANUAL_MOVEMENT_REASONS;

export const INVENTORY_TOOLS = [
  defineTool({
    name: 'list_inventory',
    title: 'List stock',
    description:
      'Stock of every variant: on hand, held for orders and available to sell. Filter by ' +
      'stock level to find what is low or out.',
    input: { search: SEARCH_INPUT, stockLevel: z.enum(StockLevel).optional(), ...PAGE_INPUT },
    readOnly: true,
    scope: AgentScope.CatalogRead,
    toCall: (input) => ({ method: HttpMethod.Get, path: INVENTORY_PATH, query: input }),
  }),
  defineTool({
    name: 'adjust_stock',
    title: 'Adjust stock',
    description:
      'Change a variant’s stock on hand: add or remove units (mode "delta"), or set the counted ' +
      'quantity (mode "set"). Every connected store gets the new quantity.',
    input: {
      inventoryItemId: ID_INPUT.describe('From list_inventory'),
      mode: z.enum(StockAdjustmentMode),
      quantity: z.number().int(),
      reason: z.enum([FIRST_REASON ?? '', ...OTHER_REASONS] as [string, ...string[]]),
      note: z.string().max(NOTE_MAX_LENGTH).optional(),
    },
    readOnly: false,
    scope: AgentScope.CatalogWrite,
    toCall: ({ inventoryItemId, ...adjustment }) => ({
      method: HttpMethod.Post,
      path: `${INVENTORY_PATH}/${inventoryItemId}/adjustments`,
      body: adjustment,
    }),
  }),
];
