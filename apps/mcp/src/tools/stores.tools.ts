import { AgentScope } from '@crossmart/core/agents/enums/agent-scope.enum.js';
import { HttpMethod } from '../api/api-call.js';
import { WORKSPACE_PATH } from '../mcp.constants.js';
import { defineTool } from './api-tool.js';
import { ID_INPUT } from './tool-inputs.js';

function productStorePath(productId: string, connectionId: string): string {
  return `${WORKSPACE_PATH}/products/${productId}/channels/${connectionId}`;
}

export const STORE_TOOLS = [
  defineTool({
    name: 'list_stores',
    title: 'List stores',
    description:
      'Connected stores (such as Shopify) with their status and listing counts. Connecting a ' +
      'store needs the merchant’s own approval in the Crossmart app.',
    input: {},
    readOnly: true,
    scope: AgentScope.CatalogRead,
    toCall: () => ({ method: HttpMethod.Get, path: `${WORKSPACE_PATH}/channel-connections` }),
  }),
  defineTool({
    name: 'add_product_to_store',
    title: 'Add a product to a store',
    description:
      'List a product on a connected store. Crossmart publishes it and keeps it in sync.',
    input: { productId: ID_INPUT, connectionId: ID_INPUT.describe('From list_stores') },
    readOnly: false,
    scope: AgentScope.StoresWrite,
    toCall: ({ productId, connectionId }) => ({
      method: HttpMethod.Post,
      path: productStorePath(productId, connectionId),
    }),
  }),
  defineTool({
    name: 'remove_product_from_store',
    title: 'Remove a product from a store',
    description: 'Take a product off a store. It is archived there and keeps its order history.',
    input: { productId: ID_INPUT, connectionId: ID_INPUT },
    readOnly: false,
    scope: AgentScope.StoresWrite,
    destructive: true,
    toCall: ({ productId, connectionId }) => ({
      method: HttpMethod.Delete,
      path: productStorePath(productId, connectionId),
    }),
  }),
];
