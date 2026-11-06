import { z } from 'zod';
import { HttpMethod } from '../api/api-call.js';
import { API_HEALTH_PATH, ASK_PATH, WORKSPACE_PATH } from '../mcp.constants.js';
import { ALL_TOOLS } from './index.js';

const SNAKE_CASE = /^[a-z]+(_[a-z]+)*$/;

function tool(name: string) {
  const found = ALL_TOOLS.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No tool ${name}`);
  return found;
}

describe('MCP tools', () => {
  it('have unique snake_case names and a description', () => {
    const names = ALL_TOOLS.map((spec) => spec.name);
    expect(new Set(names).size).toBe(names.length);
    for (const spec of ALL_TOOLS) {
      expect(spec.name).toMatch(SNAKE_CASE);
      expect(spec.description.length).toBeGreaterThan(0);
    }
  });

  it('read only with GET, apart from asking a question, which changes nothing', () => {
    const readOnlyMethods = ALL_TOOLS.filter(
      (spec) => spec.readOnly && spec.name !== 'ask_crossmart',
    ).map((spec) => spec.toCall({} as never).method);
    expect(new Set(readOnlyMethods)).toEqual(new Set([HttpMethod.Get]));
  });

  it('stay inside the key’s workspace, apart from the health check and Ask', () => {
    const outside = ALL_TOOLS.map((spec) => spec.toCall({} as never).path).filter(
      (path) => !path.startsWith(WORKSPACE_PATH),
    );
    expect(outside).toEqual([API_HEALTH_PATH, ASK_PATH]);
  });

  it('asks Crossmart a question, read only and outside any workspace', () => {
    const spec = tool('ask_crossmart');

    expect(spec.readOnly).toBe(true);
    expect(spec.toCall({ question: 'Does it support Etsy?' } as never)).toEqual({
      method: HttpMethod.Post,
      path: ASK_PATH,
      body: { question: 'Does it support Etsy?' },
    });
  });

  it('sends a replaced product without its id in the body', () => {
    const call = tool('replace_product').toCall({
      productId: 'p-1',
      title: 'Mug',
      variants: [],
    } as never);
    expect(call).toEqual({
      method: HttpMethod.Put,
      path: `${WORKSPACE_PATH}/products/p-1`,
      body: { title: 'Mug', variants: [] },
    });
  });

  it('marks tools that remove things as destructive', () => {
    expect(tool('remove_product_from_store').destructive).toBe(true);
    expect(tool('replace_product').destructive).toBe(true);
    expect(tool('create_product').destructive).toBeFalsy();
  });

  it('asks for content generation without approving anything', () => {
    const call = tool('generate_content').toCall({
      connectionId: 'c-1',
      productIds: ['p-1'],
    } as never);
    expect(call).toEqual({
      method: HttpMethod.Post,
      path: `${WORKSPACE_PATH}/ai/content-generations`,
      body: { connectionId: 'c-1', productIds: ['p-1'] },
    });
  });

  it('lists suggestions and approves one by its id', () => {
    expect(tool('list_suggestions').readOnly).toBe(true);
    expect(tool('approve_suggestion').toCall({ suggestionId: 's-1' } as never)).toEqual({
      method: HttpMethod.Post,
      path: `${WORKSPACE_PATH}/suggestions/s-1/approve`,
    });
  });

  it('lists a store’s products by state, with the rest as query', () => {
    const call = tool('list_store_products').toCall({
      connectionId: 'c-1',
      state: 'failed',
      displayState: 'needs_details',
      page: 2,
    } as never);
    expect(call).toEqual({
      method: HttpMethod.Get,
      path: `${WORKSPACE_PATH}/channel-connections/c-1/products`,
      query: { state: 'failed', displayState: 'needs_details', page: 2 },
    });
  });

  it('takes only known display states when listing a store’s products', () => {
    const input = z.object(tool('list_store_products').input);
    const base = { connectionId: '3f1c2b7a-9e8d-4c6b-a5f4-e3d2c1b0a9f8' };
    expect(input.safeParse({ ...base, displayState: 'ready' }).success).toBe(true);
    expect(input.safeParse({ ...base, displayState: 'stuck' }).success).toBe(false);
  });

  it('reads a listing field by field, and patches its overrides with null reverting', () => {
    const target = { productId: 'p-1', connectionId: 'c-1' };
    expect(tool('get_listing').toCall(target as never)).toEqual({
      method: HttpMethod.Get,
      path: `${WORKSPACE_PATH}/products/p-1/channels/c-1/listing`,
    });
    const patch = { title: null, vendor: 'Store brand' };
    expect(tool('update_listing').toCall({ ...target, ...patch } as never)).toEqual({
      method: HttpMethod.Patch,
      path: `${WORKSPACE_PATH}/products/p-1/channels/c-1/override`,
      body: patch,
    });
    expect(tool('update_listing').readOnly).toBe(false);
  });

  it('reads a store’s sync progress', () => {
    expect(tool('get_sync_progress').toCall({ connectionId: 'c-1' } as never)).toEqual({
      method: HttpMethod.Get,
      path: `${WORKSPACE_PATH}/channel-connections/c-1/sync`,
    });
  });

  it('retries one product on one store', () => {
    expect(
      tool('retry_store_listing').toCall({ productId: 'p-1', connectionId: 'c-1' } as never),
    ).toEqual({
      method: HttpMethod.Post,
      path: `${WORKSPACE_PATH}/products/p-1/channels/c-1/retry`,
    });
    expect(tool('retry_store_listing').readOnly).toBe(false);
  });

  it('reads a store and a product on every store', () => {
    expect(tool('get_store').toCall({ connectionId: 'c-1' } as never).path).toBe(
      `${WORKSPACE_PATH}/channel-connections/c-1`,
    );
    expect(tool('get_product_stores').toCall({ productId: 'p-1' } as never).path).toBe(
      `${WORKSPACE_PATH}/products/p-1/channels`,
    );
  });

  it('reads and replaces item specifics, the replace marked destructive', () => {
    const target = { productId: 'p-1', connectionId: 'c-1' };
    const path = `${WORKSPACE_PATH}/products/p-1/channels/c-1/item-specifics`;
    expect(tool('get_item_specifics').toCall(target as never)).toEqual({
      method: HttpMethod.Get,
      path,
    });
    const itemSpecifics = [{ name: 'Color', values: ['Blue'] }];
    expect(tool('save_item_specifics').toCall({ ...target, itemSpecifics } as never)).toEqual({
      method: HttpMethod.Put,
      path,
      body: { itemSpecifics },
    });
    expect(tool('save_item_specifics').destructive).toBe(true);
  });

  it('suggests categories and sets one, null letting the next publish pick', () => {
    const target = { productId: 'p-1', connectionId: 'c-1' };
    expect(tool('suggest_store_categories').toCall({ ...target, search: 'mug' } as never)).toEqual({
      method: HttpMethod.Get,
      path: `${WORKSPACE_PATH}/products/p-1/channels/c-1/category-suggestions`,
      query: { search: 'mug' },
    });
    expect(tool('set_store_category').toCall({ ...target, category: null } as never)).toEqual({
      method: HttpMethod.Put,
      path: `${WORKSPACE_PATH}/products/p-1/channels/c-1/category`,
      body: { category: null },
    });
  });
});
