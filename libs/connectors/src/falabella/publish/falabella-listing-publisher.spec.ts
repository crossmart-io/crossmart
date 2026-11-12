import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import { FalabellaAction } from '../falabella.enums.js';
import {
  actionUrl,
  BLACK_ID,
  createFalabellaTestKit,
  DERIVED_BLACK_SKU,
  expectFeed,
  sentParam,
  sentXml,
  shoeDraft,
  WHITE_ID,
  xmlFixture,
} from '../falabella.fixtures.js';

function expectShoeCategory(http: ReturnType<typeof createFalabellaTestKit>['http']): void {
  http.expect(
    HttpMethod.Get,
    actionUrl(FalabellaAction.GetCategoryAttributes),
    xmlFixture('category-attributes-shoes.xml'),
  );
}

const WHITE_PRODUCT = {
  SellerSku: 'SHOE-WHITE',
  ParentSku: 'SHOE-WHITE',
  Name: 'Zapatillas running <livianas>',
  PrimaryCategory: '811',
  Description: '<p>Zapatillas <b>livianas</b> para correr.</p>',
  Brand: 'EPATE',
  ProductId: '4066749430450',
  ColorBasicoVariant: 'Blanco',
  BusinessUnits: {
    BusinessUnit: { OperatorCode: 'facl', Price: '59990.00', Stock: '36', Status: 'active' },
  },
  ProductData: {
    ConditionType: 'Usado',
    PackageWeight: '1',
    Genero: 'Mujer',
    PackageHeight: '10',
    PackageWidth: '12',
    PackageLength: '30',
  },
};

describe('FalabellaListingPublisher', () => {
  it('creates a product per variant under one parent, then sends the images', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    expectShoeCategory(http);
    http.expect(
      HttpMethod.Get,
      actionUrl(FalabellaAction.GetProducts),
      xmlFixture('products-empty.xml'),
    );
    expectFeed(http, FalabellaAction.ProductCreate, 'product-create.xml');
    expectFeed(http, FalabellaAction.Image, 'image.xml');

    const published = await connector.publish(session, shoeDraft());

    expect(sentParam(http, 1, 'SkuSellerList')).toBe(`["SHOE-WHITE","${DERIVED_BLACK_SKU}"]`);
    expect(sentXml(http, 2)).toEqual({
      '?xml': '',
      Request: {
        Product: [
          WHITE_PRODUCT,
          {
            ...WHITE_PRODUCT,
            SellerSku: DERIVED_BLACK_SKU,
            ProductId: undefined,
            ColorBasicoVariant: 'Negro',
            BusinessUnits: {
              BusinessUnit: { ...WHITE_PRODUCT.BusinessUnits.BusinessUnit, Stock: '0' },
            },
          },
        ].map((product) => JSON.parse(JSON.stringify(product)) as unknown),
      },
    });
    expect(http.requests[2]?.headers?.['content-type']).toBe('application/x-www-form-urlencoded');
    expect(sentParam(http, 3, 'FeedID')).toBe('cb106552-87f3-450b-aa8b-412246a24b34');
    expect(sentXml(http, 4)).toMatchObject({
      Request: {
        ProductImage: [
          { SellerSku: 'SHOE-WHITE', Images: { Image: 'https://cdn.example/shoe-front.jpg' } },
          { SellerSku: DERIVED_BLACK_SKU, Images: { Image: 'https://cdn.example/shoe-front.jpg' } },
        ],
      },
    });
    expect(published).toEqual({
      externalId: 'SHOE-WHITE',
      externalUrl: null,
      active: true,
      variants: [
        { variantId: WHITE_ID, externalId: 'SHOE-WHITE', externalInventoryId: 'SHOE-WHITE' },
        {
          variantId: BLACK_ID,
          externalId: DERIVED_BLACK_SKU,
          externalInventoryId: DERIVED_BLACK_SKU,
        },
      ],
      category: { id: '811', name: 'Calzado > Zapatillas' },
    });
    http.assertDone();
  });

  it('updates products Falabella holds already, so a retried publish creates nothing twice', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    expectShoeCategory(http);
    http.expect(HttpMethod.Get, actionUrl(FalabellaAction.GetProducts), xmlFixture('products.xml'));
    expectFeed(http, FalabellaAction.ProductUpdate, 'product-update.xml');

    await connector.publish(session, shoeDraft({ imagesChanged: false }));

    expect(http.requests.map((request) => request.method)).toEqual(['GET', 'GET', 'POST', 'GET']);
    http.assertDone();
  });

  it('updates a listed product and resends images only when they changed', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    expectShoeCategory(http);
    expectFeed(http, FalabellaAction.ProductUpdate, 'product-update.xml');
    expectFeed(http, FalabellaAction.Image, 'image.xml');

    await connector.update(session, 'SHOE-WHITE', shoeDraft({ imagesChanged: true }));

    expect(sentXml(http, 3)).toMatchObject({ Request: { ProductImage: expect.any(Array) } });
    http.assertDone();
  });

  it('waits for a queued feed, then reports the rows Falabella refused', async () => {
    const { connector, http, session, sleeper } = createFalabellaTestKit();
    expectShoeCategory(http);
    http
      .expect(
        HttpMethod.Post,
        actionUrl(FalabellaAction.ProductUpdate),
        xmlFixture('product-update.xml'),
      )
      .expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.FeedStatus),
        xmlFixture('feed-status-queued.xml'),
      )
      .expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.FeedStatus),
        xmlFixture('feed-status-errors.xml'),
      );

    await expect(connector.update(session, 'SHOE-WHITE', shoeDraft())).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message: expect.stringContaining('Primary category Id is invalid'),
    });
    expect(sleeper.waits).toEqual([5_000]);
    http.assertDone();
  });

  it('takes a feed still queued after the wait as accepted', async () => {
    const { connector, http, session, sleeper } = createFalabellaTestKit();
    expectShoeCategory(http);
    http.expect(
      HttpMethod.Post,
      actionUrl(FalabellaAction.ProductUpdate),
      xmlFixture('product-update.xml'),
    );
    for (let attempt = 0; attempt < 12; attempt += 1) {
      http.expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.FeedStatus),
        xmlFixture('feed-status-queued.xml'),
      );
    }

    const published = await connector.update(
      session,
      'SHOE-WHITE',
      shoeDraft({ imagesChanged: false }),
    );

    expect(published.externalId).toBe('SHOE-WHITE');
    expect(sleeper.waits).toHaveLength(11);
    http.assertDone();
  });

  it('refuses before writing when required attributes have no value', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    expectShoeCategory(http);
    const draft = shoeDraft({ itemSpecifics: [] });

    await expect(
      connector.publish(session, {
        ...draft,
        product: { ...draft.product, optionNames: ['Color'] },
      }),
    ).rejects.toMatchObject({
      requirement: PublishRequirement.ItemSpecifics,
      message: expect.stringContaining(
        'Color básico variant, Género, Package height, Package width (cm), Package length (cm), Package weight (kg)',
      ),
    });
    http.assertDone();
  });

  it('puts a product without a category in Falabella’s best match, or asks for one', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    http
      .expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.GetCategoryTree),
        xmlFixture('category-tree.xml'),
      )
      .expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.GetCategorySuggestion),
        xmlFixture('category-suggestion.xml'),
      );

    await expect(connector.publish(session, shoeDraft({ category: null }))).rejects.toMatchObject({
      requirement: PublishRequirement.Category,
    });
  });

  it('ends a listing by setting its SKUs inactive, never removing them', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    expectFeed(http, FalabellaAction.ProductUpdate, 'product-update.xml');

    await connector.delist(session, 'SHOE-WHITE', {
      productId: 'shoe',
      variantExternalIds: ['SHOE-WHITE', DERIVED_BLACK_SKU],
    });

    expect(sentXml(http, 0)).toMatchObject({
      Request: {
        Product: [
          {
            SellerSku: 'SHOE-WHITE',
            BusinessUnits: { BusinessUnit: { OperatorCode: 'facl', Status: 'inactive' } },
          },
          { SellerSku: DERIVED_BLACK_SKU, BusinessUnits: { BusinessUnit: { Status: 'inactive' } } },
        ],
      },
    });
  });

  it('sets prices as the price buyers pay', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    expectFeed(http, FalabellaAction.ProductUpdate, 'product-update.xml');

    await connector.updatePrices(session, [
      {
        externalProductId: 'SHOE-WHITE',
        externalVariantId: 'SHOE-WHITE',
        price: '49990',
        compareAtPrice: '59990',
      },
    ]);

    expect(sentXml(http, 0)).toMatchObject({
      Request: {
        Product: {
          SellerSku: 'SHOE-WHITE',
          BusinessUnits: { BusinessUnit: { Price: '49990.00' } },
        },
      },
    });
  });
});
