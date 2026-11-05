import { describe, expect, it } from 'vitest';
import { Crossmart } from './crossmart.js';
import { type Page, paginate } from './pagination.js';
import { jsonResponse, mockFetch, TEST_BASE_URL, WORKSPACE_ID } from './testing/mock-fetch.js';

const ORDERS_URL = `${TEST_BASE_URL}/api/v1/workspaces/${WORKSPACE_ID}/orders`;

function page<Item>(items: Item[], nextCursor: string | null, total = 3): Page<Item> {
  return { items, nextCursor, total };
}

async function collect<Item>(iterator: AsyncIterable<Item>): Promise<Item[]> {
  const items: Item[] = [];
  for await (const item of iterator) {
    items.push(item);
  }
  return items;
}

describe('paginate', () => {
  it('follows nextCursor until the last page', async () => {
    const cursors: Array<string | undefined> = [];
    const pages: Record<string, Page<number>> = {
      first: page([1, 2], 'second'),
      second: page([3], null),
    };

    const items = await collect(
      paginate(async (cursor) => {
        cursors.push(cursor);
        return pages[cursor ?? 'first'] ?? page([], null);
      }),
    );

    expect(items).toEqual([1, 2, 3]);
    expect(cursors).toEqual([undefined, 'second']);
  });

  it('stops fetching when the loop breaks', async () => {
    let fetches = 0;
    const iterator = paginate(async () => {
      fetches += 1;
      return page([fetches], 'more');
    });

    for await (const item of iterator) {
      expect(item).toBe(1);
      break;
    }

    expect(fetches).toBe(1);
  });
});

describe('listAll', () => {
  it('asks for the largest pages and passes each cursor on', async () => {
    const { fetch, requests } = mockFetch(
      () => jsonResponse(page([{ id: 'a' }, { id: 'b' }], 'b')),
      () => jsonResponse(page([{ id: 'c' }], null)),
    );
    const crossmart = new Crossmart(
      { apiKey: 'key' },
      { baseUrl: TEST_BASE_URL, workspaceId: WORKSPACE_ID, fetch },
    );

    const orders = await collect(crossmart.orders.listAll({ search: '#10' }));

    expect(orders.map((order) => order.id)).toEqual(['a', 'b', 'c']);
    expect(requests.map((request) => request.url)).toEqual([
      `${ORDERS_URL}?limit=100&search=%2310`,
      `${ORDERS_URL}?limit=100&search=%2310&cursor=b`,
    ]);
  });

  it('keeps a smaller limit the caller asks for', async () => {
    const { fetch, requests } = mockFetch(() => jsonResponse(page([], null, 0)));
    const crossmart = new Crossmart(
      { apiKey: 'key' },
      { baseUrl: TEST_BASE_URL, workspaceId: WORKSPACE_ID, fetch },
    );

    await collect(crossmart.orders.listAll({ limit: 10 }));

    expect(requests[0]?.url).toBe(`${ORDERS_URL}?limit=10`);
  });
});
