import {
  CategoryAspectMode,
  CategoryAspectUsage,
} from '../../sdk/capabilities/taxonomy-provider.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { EBAY_ASPECT_VALUES_MAX } from '../ebay.constants.js';
import { ACCOUNT_ID, createEbayTestKit, FIXTURES } from '../ebay.fixtures.js';

const TAXONOMY = 'https://api.sandbox.ebay.com/commerce/taxonomy/v1';
const TREE_URL = `${TAXONOMY}/get_default_category_tree_id?marketplace_id=EBAY_US`;
const aspectsUrl = (categoryId: string) =>
  `${TAXONOMY}/category_tree/0/get_item_aspects_for_category?category_id=${categoryId}`;
const session = fakeChannelSession(ACCOUNT_ID);

function expectTree(kit: ReturnType<typeof createEbayTestKit>): void {
  kit.http.expect(HttpMethod.Get, TREE_URL, fixtureResponse(FIXTURES, 'category-tree.json'));
}

describe('EbayCategoryAspectsReader', () => {
  it('reads a category’s aspects, required first, then recommended, then optional', async () => {
    const kit = createEbayTestKit();
    expectTree(kit);
    kit.http.expect(
      HttpMethod.Get,
      aspectsUrl('57990'),
      fixtureResponse(FIXTURES, 'item-aspects.json'),
    );

    const aspects = await kit.connector.categoryAspects(session, '57990');

    kit.http.assertDone();
    expect(aspects.map((aspect) => aspect.name)).toEqual([
      'Brand',
      'Department',
      'Size',
      'Color',
      'Features',
      'Theme',
    ]);
    expect(aspects[1]).toEqual({
      name: 'Department',
      required: true,
      usage: CategoryAspectUsage.Recommended,
      mode: CategoryAspectMode.SelectionOnly,
      multiple: false,
      values: ['Men', 'Women', 'Unisex Adults'],
    });
    expect(aspects.find((aspect) => aspect.name === 'Color')).toMatchObject({
      required: false,
      mode: CategoryAspectMode.FreeText,
      multiple: true,
    });
    // A usage eBay adds later reads as optional; an aspect without values lists none.
    expect(aspects.at(-1)).toMatchObject({ usage: CategoryAspectUsage.Optional, values: [] });
  });

  it('keeps the first values of an aspect with very many', async () => {
    const kit = createEbayTestKit();
    expectTree(kit);
    const values = Array.from({ length: EBAY_ASPECT_VALUES_MAX + 5 }, (_, index) => ({
      localizedValue: `Brand ${index}`,
    }));
    kit.http.expect(
      HttpMethod.Get,
      aspectsUrl('1'),
      jsonResponse({
        aspects: [
          {
            localizedAspectName: 'Brand',
            aspectConstraint: {
              aspectRequired: true,
              aspectUsage: 'RECOMMENDED',
              aspectMode: 'FREE_TEXT',
              itemToAspectCardinality: 'SINGLE',
            },
            aspectValues: values,
          },
        ],
      }),
    );

    const [brand] = await kit.connector.categoryAspects(session, '1');

    expect(brand?.values).toHaveLength(EBAY_ASPECT_VALUES_MAX);
    expect(brand?.values[0]).toBe('Brand 0');
  });

  it('reads each category once, and answers none when eBay has no aspects for it', async () => {
    const kit = createEbayTestKit();
    expectTree(kit);
    kit.http
      .expect(HttpMethod.Get, aspectsUrl('57990'), fixtureResponse(FIXTURES, 'item-aspects.json'))
      .expect(HttpMethod.Get, aspectsUrl('99'), { status: 204, headers: {}, body: '' });

    const first = await kit.connector.categoryAspects(session, '57990');
    const again = await kit.connector.categoryAspects(session, '57990');
    const none = await kit.connector.categoryAspects(session, '99');

    kit.http.assertDone();
    expect(again).toBe(first);
    expect(none).toEqual([]);
    expect(kit.http.requests).toHaveLength(3);
  });
});
