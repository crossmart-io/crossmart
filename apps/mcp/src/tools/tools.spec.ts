import { HttpMethod } from '../api/api-call.js';
import { API_HEALTH_PATH, WORKSPACE_PATH } from '../mcp.constants.js';
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

  it('read only with GET', () => {
    const readOnlyMethods = ALL_TOOLS.filter((spec) => spec.readOnly).map(
      (spec) => spec.toCall({} as never).method,
    );
    expect(new Set(readOnlyMethods)).toEqual(new Set([HttpMethod.Get]));
  });

  it('stay inside the key’s workspace, apart from the health check', () => {
    const outside = ALL_TOOLS.map((spec) => spec.toCall({} as never).path).filter(
      (path) => !path.startsWith(WORKSPACE_PATH),
    );
    expect(outside).toEqual([API_HEALTH_PATH]);
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
});
