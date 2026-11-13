import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import type { HttpRequest } from '../../sdk/http/http-transport.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import {
  API,
  ATTRIBUTES_URL,
  CATEGORY,
  CATEGORY_URL,
  createMercadoLibreTestKit,
  descriptionUrl,
  draftVariant,
  FIXTURES,
  fixtureJson,
  ITEMS_URL,
  itemUrl,
  listingDraft,
  mercadoLibreSession,
  mercadoLibreSettings,
  VARIANT_BLACK,
  VARIANT_BROWN,
} from '../mercadolibre.fixtures.js';

const ITEM_ID = 'MLA657381404';
const UP_ITEM_ID = 'MLM2061397137';
const UP_SECOND_ITEM_ID = 'MLM2061397138';
const UP_SESSION = mercadoLibreSession(mercadoLibreSettings({ userProductSeller: true }));

function body(request: HttpRequest | undefined): Record<string, unknown> {
  return JSON.parse(request?.body ?? '{}') as Record<string, unknown>;
}

function requestsTo(http: { requests: HttpRequest[] }, method: HttpMethod, url: string) {
  return http.requests.filter((request) => request.method === method && request.url === url);
}

function setup() {
  const kit = createMercadoLibreTestKit();
  kit.http.expect(
    HttpMethod.Get,
    ATTRIBUTES_URL,
    fixtureResponse(FIXTURES, 'category-attributes.json'),
  );
  return kit;
}

function userProductItem(id: string, overrides: Record<string, unknown> = {}) {
  const item = fixtureJson<Record<string, unknown>>('user-product-item.json');
  return jsonResponse({ ...item, id, ...overrides });
}

describe('MercadoLibreListingPublisher', () => {
  describe('one item with variations (sellers without User Products)', () => {
    it('creates the item with a variation per variant, then its description', async () => {
      const { connector, http } = setup();
      http
        .expect(HttpMethod.Post, ITEMS_URL, fixtureResponse(FIXTURES, 'item-with-variations.json'))
        .expect(
          HttpMethod.Post,
          descriptionUrl(ITEM_ID),
          fixtureResponse(FIXTURES, 'description.json'),
        );

      const published = await connector.publish(mercadoLibreSession(), listingDraft());

      expect(body(requestsTo(http, HttpMethod.Post, ITEMS_URL)[0])).toEqual({
        category_id: 'MLA1055',
        currency_id: 'ARS',
        buying_mode: 'buy_it_now',
        listing_type_id: 'gold_special',
        condition: 'new',
        title: 'Item de testeo',
        pictures: [{ source: 'https://cdn.example.com/celular.jpg' }],
        price: 100,
        available_quantity: 8,
        attributes: [{ id: 'BRAND', value_name: 'Eiffel' }],
        variations: [VARIANT_BLACK, VARIANT_BROWN].map((variantId, position) => ({
          price: 100,
          available_quantity: 4,
          attributes: [
            { id: 'SELLER_SKU', value_name: ['CEL-NEGRO', 'CEL-MARRON'][position] },
            { id: 'GTIN', value_name: ['4006381333931', '9780471117094'][position] },
          ],
          attribute_combinations: [{ id: 'COLOR', value_name: ['Negro', 'Marrón'][position] }],
          picture_ids: ['https://cdn.example.com/celular.jpg'],
          seller_custom_field: variantId,
        })),
      });
      expect(body(requestsTo(http, HttpMethod.Post, descriptionUrl(ITEM_ID))[0])).toEqual({
        plain_text: 'Celular libre.',
      });
      expect(published).toEqual({
        externalId: ITEM_ID,
        externalUrl: 'http://articulo.mercadolibre.com.ar/MLA-657381404-item-de-testeo-_JM',
        active: true,
        variants: [
          {
            variantId: VARIANT_BLACK,
            externalId: `${ITEM_ID}:14979332589`,
            externalInventoryId: `${ITEM_ID}:14979332589`,
          },
          {
            variantId: VARIANT_BROWN,
            externalId: `${ITEM_ID}:14979332592`,
            externalInventoryId: `${ITEM_ID}:14979332592`,
          },
        ],
        category: CATEGORY,
      });
      http.assertDone();
    });

    it('refuses variants priced apart, which variations cannot be', async () => {
      const { connector, http } = setup();
      const draft = listingDraft();
      draft.variants[1] = { ...draft.variants[1]!, price: '120.00' };

      await expect(connector.publish(mercadoLibreSession(), draft)).rejects.toMatchObject({
        code: ChannelErrorCode.RequestRejected,
        message: expect.stringContaining('same price') as string,
      });
      expect(requestsTo(http, HttpMethod.Post, ITEMS_URL)).toHaveLength(0);
    });

    it('updates the item in place, keeping the title once it has sales', async () => {
      const { connector, http } = setup();
      const sold = { ...fixtureJson('item-with-variations.json'), sold_quantity: 2 };
      http
        .expect(HttpMethod.Get, itemUrl(ITEM_ID), jsonResponse(sold))
        .expect(HttpMethod.Put, itemUrl(ITEM_ID), jsonResponse(sold))
        .expect(
          HttpMethod.Put,
          `${descriptionUrl(ITEM_ID)}?api_version=2`,
          fixtureResponse(FIXTURES, 'description.json'),
        );
      const draft = listingDraft({ imagesChanged: false });
      draft.variants = draft.variants.map((variant, position) => ({
        ...variant,
        externalVariantId: `${ITEM_ID}:${[14979332589, 14979332592][position]}`,
      }));

      const published = await connector.update(mercadoLibreSession(), ITEM_ID, draft);

      const sent = body(requestsTo(http, HttpMethod.Put, itemUrl(ITEM_ID))[0]);
      expect(sent).not.toHaveProperty('title');
      expect(sent).not.toHaveProperty('pictures');
      expect(sent.variations).toEqual([
        expect.objectContaining({ id: 14979332589, price: 100, available_quantity: 4 }),
        expect.objectContaining({ id: 14979332592, price: 100, available_quantity: 4 }),
      ]);
      expect(published.variants.map((variant) => variant.externalId)).toEqual([
        `${ITEM_ID}:14979332589`,
        `${ITEM_ID}:14979332592`,
      ]);
      http.assertDone();
    });

    it('pauses the item of an inactive product', async () => {
      const { connector, http } = setup();
      const created = fixtureJson('item-created.json');
      http
        .expect(HttpMethod.Post, ITEMS_URL, jsonResponse(created))
        .expect(
          HttpMethod.Post,
          descriptionUrl('MLB1548991737'),
          fixtureResponse(FIXTURES, 'description.json'),
        )
        .expect(
          HttpMethod.Put,
          itemUrl('MLB1548991737'),
          jsonResponse({ ...created, status: 'paused' }),
        );
      const draft = listingDraft({ variants: [draftVariant()] });
      draft.product = { ...draft.product, active: false, optionNames: [] };

      const published = await connector.publish(mercadoLibreSession(), draft);

      expect(body(requestsTo(http, HttpMethod.Put, itemUrl('MLB1548991737'))[0])).toEqual({
        status: 'paused',
      });
      expect(published).toMatchObject({
        active: false,
        variants: [{ variantId: VARIANT_BLACK, externalId: 'MLB1548991737' }],
      });
    });
  });

  describe('User Products sellers', () => {
    it('creates an item per variant under one family name', async () => {
      const { connector, http } = setup();
      http
        .expect(HttpMethod.Post, ITEMS_URL, userProductItem(UP_ITEM_ID))
        .expect(
          HttpMethod.Post,
          descriptionUrl(UP_ITEM_ID),
          fixtureResponse(FIXTURES, 'description.json'),
        )
        .expect(HttpMethod.Post, ITEMS_URL, userProductItem(UP_SECOND_ITEM_ID))
        .expect(
          HttpMethod.Post,
          descriptionUrl(UP_SECOND_ITEM_ID),
          fixtureResponse(FIXTURES, 'description.json'),
        );
      const draft = listingDraft();
      draft.variants[1] = { ...draft.variants[1]!, price: '120.00' };

      const published = await connector.publish(UP_SESSION, draft);

      const [black, brown] = requestsTo(http, HttpMethod.Post, ITEMS_URL).map(body);
      expect(black).toMatchObject({ family_name: 'Item de testeo', price: 100 });
      expect(black).not.toHaveProperty('title');
      expect(black).not.toHaveProperty('variations');
      expect(brown).toMatchObject({
        price: 120,
        attributes: [
          { id: 'BRAND', value_name: 'Eiffel' },
          { id: 'COLOR', value_name: 'Marrón' },
          { id: 'SELLER_SKU', value_name: 'CEL-MARRON' },
          { id: 'GTIN', value_name: '9780471117094' },
        ],
      });
      expect(published).toMatchObject({
        externalId: UP_ITEM_ID,
        active: true,
        variants: [
          { variantId: VARIANT_BLACK, externalId: UP_ITEM_ID, externalInventoryId: UP_ITEM_ID },
          { variantId: VARIANT_BROWN, externalId: UP_SECOND_ITEM_ID },
        ],
      });
      http.assertDone();
    });

    it('closes the items it created when a later one is refused, naming Mercado Libre’s cause', async () => {
      const { connector, http } = setup();
      http
        .expect(HttpMethod.Post, ITEMS_URL, userProductItem(UP_ITEM_ID))
        .expect(
          HttpMethod.Post,
          descriptionUrl(UP_ITEM_ID),
          fixtureResponse(FIXTURES, 'description.json'),
        )
        .expect(
          HttpMethod.Post,
          ITEMS_URL,
          fixtureResponse(FIXTURES, 'missing-gtin-reason.json', 400),
        )
        .expect(HttpMethod.Get, itemUrl(UP_ITEM_ID), userProductItem(UP_ITEM_ID))
        .expect(
          HttpMethod.Put,
          itemUrl(UP_ITEM_ID),
          userProductItem(UP_ITEM_ID, { status: 'closed' }),
        );

      await expect(connector.publish(UP_SESSION, listingDraft())).rejects.toMatchObject({
        code: ChannelErrorCode.RequestRejected,
        message: expect.stringContaining('[EMPTY_GTIN_REASON] are required') as string,
      });
      expect(body(requestsTo(http, HttpMethod.Put, itemUrl(UP_ITEM_ID))[0])).toEqual({
        status: 'closed',
      });
      http.assertDone();
    });

    it('updates each variant’s item and adds a new variant to the family', async () => {
      const { connector, http } = setup();
      http
        .expect(HttpMethod.Get, itemUrl(UP_ITEM_ID), userProductItem(UP_ITEM_ID))
        .expect(HttpMethod.Get, itemUrl(UP_ITEM_ID), userProductItem(UP_ITEM_ID))
        .expect(HttpMethod.Put, itemUrl(UP_ITEM_ID), userProductItem(UP_ITEM_ID))
        .expect(
          HttpMethod.Put,
          `${descriptionUrl(UP_ITEM_ID)}?api_version=2`,
          fixtureResponse(FIXTURES, 'description.json'),
        )
        .expect(HttpMethod.Post, ITEMS_URL, userProductItem(UP_SECOND_ITEM_ID))
        .expect(
          HttpMethod.Post,
          descriptionUrl(UP_SECOND_ITEM_ID),
          fixtureResponse(FIXTURES, 'description.json'),
        );
      const draft = listingDraft();
      draft.variants[0] = { ...draft.variants[0]!, externalVariantId: UP_ITEM_ID };

      const published = await connector.update(UP_SESSION, UP_ITEM_ID, draft);

      expect(body(requestsTo(http, HttpMethod.Put, itemUrl(UP_ITEM_ID))[0])).not.toHaveProperty(
        'family_name',
      );
      expect(body(requestsTo(http, HttpMethod.Post, ITEMS_URL)[0])).toMatchObject({
        family_name: 'Apple iPhone 256GB',
      });
      expect(published.variants.map((variant) => variant.externalId)).toEqual([
        UP_ITEM_ID,
        UP_SECOND_ITEM_ID,
      ]);
      http.assertDone();
    });
  });

  describe('before the first write', () => {
    it('refuses a listing without the category’s required attributes', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      const attributes = fixtureJson<{ id: string; tags: Record<string, boolean> }[]>(
        'category-attributes.json',
      );
      for (const attribute of attributes) {
        if (attribute.id === 'MODEL') attribute.tags = { required: true };
      }
      http.expect(HttpMethod.Get, ATTRIBUTES_URL, jsonResponse(attributes));

      await expect(connector.publish(mercadoLibreSession(), listingDraft())).rejects.toMatchObject({
        requirement: PublishRequirement.ItemSpecifics,
        message: expect.stringContaining('Modelo') as string,
      });
    });

    it('refuses a product without images, or a connection without settings', async () => {
      const { connector } = createMercadoLibreTestKit();
      const draft = listingDraft();
      draft.product = { ...draft.product, images: [] };

      await expect(connector.publish(mercadoLibreSession(), draft)).rejects.toMatchObject({
        requirement: PublishRequirement.Images,
      });
      await expect(
        connector.publish(mercadoLibreSession(null), listingDraft()),
      ).rejects.toMatchObject({
        requirement: PublishRequirement.AccountSettings,
      });
    });

    it('predicts a category for a listing without one', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      http
        .expect(
          HttpMethod.Get,
          /\/sites\/MLA\/domain_discovery\/search\?q=Item\+de\+testeo&limit=4$/,
          fixtureResponse(FIXTURES, 'domain-discovery.json'),
        )
        .expect(HttpMethod.Get, CATEGORY_URL, fixtureResponse(FIXTURES, 'category.json'))
        .expect(
          HttpMethod.Get,
          ATTRIBUTES_URL,
          fixtureResponse(FIXTURES, 'category-attributes.json'),
        )
        .expect(HttpMethod.Post, ITEMS_URL, fixtureResponse(FIXTURES, 'item-with-variations.json'))
        .expect(
          HttpMethod.Post,
          descriptionUrl(ITEM_ID),
          fixtureResponse(FIXTURES, 'description.json'),
        );

      const published = await connector.publish(
        mercadoLibreSession(),
        listingDraft({ category: null }),
      );

      expect(published.category).toEqual(CATEGORY);
      http.assertDone();
    });
  });

  it('ends a listing by closing its items, leaving closed ones alone', async () => {
    const { connector, http } = createMercadoLibreTestKit();
    http
      .expect(HttpMethod.Get, itemUrl(UP_ITEM_ID), userProductItem(UP_ITEM_ID))
      .expect(
        HttpMethod.Put,
        itemUrl(UP_ITEM_ID),
        userProductItem(UP_ITEM_ID, { status: 'closed' }),
      )
      .expect(
        HttpMethod.Get,
        itemUrl(UP_SECOND_ITEM_ID),
        userProductItem(UP_SECOND_ITEM_ID, { status: 'closed' }),
      );

    await connector.delist(UP_SESSION, UP_ITEM_ID, {
      productId: 'product-1',
      variantExternalIds: [UP_ITEM_ID, UP_SECOND_ITEM_ID],
    });

    http.assertDone();
    expect(requestsTo(http, HttpMethod.Put, `${API}/items/${UP_SECOND_ITEM_ID}`)).toHaveLength(0);
  });
});
