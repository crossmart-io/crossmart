import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import type { HttpRequest } from '../../sdk/http/http-transport.js';
import { ImageFetchFailure } from '../../sdk/images/image-fetcher.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse, loadFixture } from '../../sdk/testing/fixtures.js';
import {
  createEtsyTestKit,
  etsySession,
  etsySettings,
  FIXTURES,
  IMAGES_URL,
  INVENTORY_URL,
  LISTING_ID,
  LISTING_URL,
  mugDraft,
  SHOP_LISTING_URL,
  SHOP_LISTINGS_URL,
  TAXONOMY_URL,
  UPLOAD_IMAGE_URL,
  VARIANT_L,
  VARIANT_S,
} from '../etsy.fixtures.js';

const DERIVED_L = 'CM222222222222422282222222222222';
const NO_IMAGES = jsonResponse({ count: 0, results: [] });

function form(request: HttpRequest | undefined): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(request?.body));
}

function multipartText(request: HttpRequest | undefined): string {
  return Buffer.from(request?.bytes ?? new Uint8Array()).toString('latin1');
}

type Kit = ReturnType<typeof createEtsyTestKit>;

function expectImagesAndInventory(
  http: Kit['http'],
  existingImages = NO_IMAGES,
  uploads = 2,
): void {
  http.expect(HttpMethod.Get, IMAGES_URL, existingImages);
  for (let upload = 0; upload < uploads; upload += 1) {
    http.expect(
      HttpMethod.Post,
      UPLOAD_IMAGE_URL,
      fixtureResponse(FIXTURES, 'image-uploaded.json', 201),
    );
  }
  http.expect(HttpMethod.Put, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'));
}

describe('EtsyListingPublisher', () => {
  describe('publish', () => {
    it('creates a draft, uploads its images, writes its inventory and activates it', async () => {
      const { connector, http, images, session } = createEtsyTestKit();
      http.expect(
        HttpMethod.Post,
        SHOP_LISTINGS_URL,
        fixtureResponse(FIXTURES, 'listing-draft.json', 201),
      );
      expectImagesAndInventory(http);
      http.expect(
        HttpMethod.Patch,
        SHOP_LISTING_URL,
        fixtureResponse(FIXTURES, 'listing-active.json'),
      );

      const published = await connector.publish(session, mugDraft());

      expect(form(http.requests[0])).toEqual({
        title: 'Speckled stoneware mug <handmade>',
        description: 'Wheel-thrown stoneware mug.',
        tags: 'stoneware mug,handmade',
        materials: 'Stoneware,Glaze leadfree',
        taxonomy_id: '1076',
        who_made: 'i_did',
        when_made: 'made_to_order',
        is_supply: 'false',
        shipping_profile_id: '6722757781',
        type: 'physical',
        quantity: '7',
        price: '28',
        readiness_state_id: '18201076875',
      });
      expect(http.requests[0]?.headers?.['content-type']).toBe('application/x-www-form-urlencoded');
      expect(images.fetched).toEqual([
        'https://cdn.example/mug-front.jpg',
        'https://cdn.example/mug-back.jpg',
      ]);
      expect(multipartText(http.requests[2])).toContain('name="rank"\r\n\r\n1\r\n');
      expect(multipartText(http.requests[2])).toContain('name="alt_text"\r\n\r\nFront\r\n');
      expect(multipartText(http.requests[2])).toContain('filename="mug-front.jpg"');
      expect(multipartText(http.requests[3])).toContain('name="rank"\r\n\r\n2\r\n');
      expect(JSON.parse(http.requests[4]?.body ?? '')).toEqual({
        products: [
          {
            sku: 'MUG-S',
            property_values: [
              { property_id: 513, property_name: 'Size', value_ids: [], values: ['Small 8 oz'] },
            ],
            offerings: [
              { price: 28, quantity: 4, is_enabled: true, readiness_state_id: 18201076875 },
            ],
          },
          {
            sku: DERIVED_L,
            property_values: [
              { property_id: 513, property_name: 'Size', value_ids: [], values: ['Large'] },
            ],
            offerings: [
              { price: 32.5, quantity: 3, is_enabled: true, readiness_state_id: 18201076875 },
            ],
          },
        ],
        price_on_property: [513],
        quantity_on_property: [513],
        sku_on_property: [513],
        readiness_state_on_property: [],
      });
      expect(form(http.requests[5])).toEqual({ state: 'active' });
      expect(published).toEqual({
        externalId: LISTING_ID,
        externalUrl: 'https://www.etsy.com/listing/1801234567/speckled-stoneware-mug',
        active: true,
        variants: [
          { variantId: VARIANT_S, externalId: 'MUG-S', externalInventoryId: `${LISTING_ID}:MUG-S` },
          {
            variantId: VARIANT_L,
            externalId: DERIVED_L,
            externalInventoryId: `${LISTING_ID}:${DERIVED_L}`,
          },
        ],
        category: { id: '1076', name: 'Home & Living > Kitchen & Dining > Drink & Barware > Mugs' },
      });
      http.assertDone();
    });

    it('puts a product without a category in the best match for its title', async () => {
      const { connector, http, session } = createEtsyTestKit();
      const draft = mugDraft({ category: null, variants: mugDraft().variants.slice(0, 1) });
      http
        .expect(HttpMethod.Get, TAXONOMY_URL, fixtureResponse(FIXTURES, 'seller-taxonomy.json'))
        .expect(
          HttpMethod.Post,
          SHOP_LISTINGS_URL,
          fixtureResponse(FIXTURES, 'listing-draft.json', 201),
        );
      expectImagesAndInventory(http);
      http.expect(
        HttpMethod.Patch,
        SHOP_LISTING_URL,
        fixtureResponse(FIXTURES, 'listing-active.json'),
      );

      const published = await connector.publish(session, {
        ...draft,
        product: { ...draft.product, title: 'Stoneware mugs' },
      });

      expect(form(http.requests[1]).taxonomy_id).toBe('1076');
      expect(JSON.parse(http.requests[5]?.body ?? '')).toMatchObject({
        products: [{ sku: 'MUG-S', property_values: [] }],
        price_on_property: [],
      });
      expect(published.category?.id).toBe('1076');
    });

    it('leaves an inactive product as a draft', async () => {
      const { connector, http, session } = createEtsyTestKit();
      const draft = mugDraft();
      http.expect(
        HttpMethod.Post,
        SHOP_LISTINGS_URL,
        fixtureResponse(FIXTURES, 'listing-draft.json', 201),
      );
      expectImagesAndInventory(http);

      const published = await connector.publish(session, {
        ...draft,
        product: { ...draft.product, active: false },
      });

      expect(published.active).toBe(false);
      http.assertDone();
    });

    it('refuses before calling Etsy when the setup, images or option names are missing', async () => {
      const { connector, http } = createEtsyTestKit();
      const draft = mugDraft();
      const unmet = (requirement: PublishRequirement) => ({
        code: ChannelErrorCode.RequestRejected,
        requirement,
      });

      await expect(
        connector.publish(etsySession(etsySettings({ listingSetup: undefined })), draft),
      ).rejects.toMatchObject(unmet(PublishRequirement.ItemDetails));
      await expect(
        connector.publish(etsySession(), { ...draft, product: { ...draft.product, images: [] } }),
      ).rejects.toMatchObject(unmet(PublishRequirement.Images));
      await expect(
        connector.publish(etsySession(), {
          ...draft,
          product: { ...draft.product, optionNames: [] },
        }),
      ).rejects.toMatchObject(unmet(PublishRequirement.OptionNames));
      expect(http.requests).toHaveLength(0);
    });

    it('asks for a category when none matches the title', async () => {
      const { connector, http, session } = createEtsyTestKit();
      http.expect(HttpMethod.Get, TAXONOMY_URL, fixtureResponse(FIXTURES, 'seller-taxonomy.json'));

      await expect(
        connector.publish(
          session,
          mugDraft({ category: null, product: { ...mugDraft().product, title: 'Zz' } }),
        ),
      ).rejects.toMatchObject({ requirement: PublishRequirement.Category });
    });

    it('supports three options with max_variations_supported', async () => {
      const { connector, http, session } = createEtsyTestKit();
      const draft = mugDraft();
      const threeOptions = {
        ...draft,
        product: { ...draft.product, optionNames: ['Size', 'Color', 'Glaze'] },
        variants: draft.variants.map((variant) => ({
          ...variant,
          optionValues: ['S', 'Blue', 'Matte'],
        })),
      };
      http.expect(
        HttpMethod.Post,
        SHOP_LISTINGS_URL,
        fixtureResponse(FIXTURES, 'listing-draft.json', 201),
      );
      http.expect(HttpMethod.Get, IMAGES_URL, NO_IMAGES);
      http
        .expect(
          HttpMethod.Post,
          UPLOAD_IMAGE_URL,
          fixtureResponse(FIXTURES, 'image-uploaded.json', 201),
        )
        .expect(
          HttpMethod.Post,
          UPLOAD_IMAGE_URL,
          fixtureResponse(FIXTURES, 'image-uploaded.json', 201),
        )
        .expect(
          HttpMethod.Put,
          `${INVENTORY_URL}?max_variations_supported=3`,
          fixtureResponse(FIXTURES, 'listing-inventory.json'),
        )
        .expect(
          HttpMethod.Patch,
          SHOP_LISTING_URL,
          fixtureResponse(FIXTURES, 'listing-active.json'),
        );

      await connector.publish(session, threeOptions);

      expect(JSON.parse(http.requests[4]?.body ?? '')).toMatchObject({
        sku_on_property: [513, 514, 516],
      });
    });

    it('reports Etsy’s reason when it rejects the listing, and an image it cannot use', async () => {
      const { connector, http, images, session } = createEtsyTestKit();
      http.expect(
        HttpMethod.Post,
        SHOP_LISTINGS_URL,
        fixtureResponse(FIXTURES, 'error-invalid-title.json', 400),
      );
      http.expect(
        HttpMethod.Post,
        SHOP_LISTINGS_URL,
        fixtureResponse(FIXTURES, 'listing-draft.json', 201),
      );
      http.expect(HttpMethod.Get, IMAGES_URL, NO_IMAGES);
      images.failOn('https://cdn.example/mug-front.jpg', ImageFetchFailure.NotAnImage);

      await expect(connector.publish(session, mugDraft())).rejects.toMatchObject({
        code: ChannelErrorCode.RequestRejected,
        message: 'Etsy rejected the request: Title contains invalid characters',
      });
      await expect(connector.publish(session, mugDraft())).rejects.toMatchObject({
        requirement: PublishRequirement.Images,
        message: expect.stringContaining('image 1'),
      });
    });
  });

  describe('update', () => {
    it('edits the listing in place, keeps its images when unchanged, and reactivates it', async () => {
      const { connector, http, session } = createEtsyTestKit();
      http
        .expect(HttpMethod.Get, LISTING_URL, fixtureResponse(FIXTURES, 'listing-inactive.json'))
        .expect(
          HttpMethod.Patch,
          SHOP_LISTING_URL,
          fixtureResponse(FIXTURES, 'listing-inactive.json'),
        )
        .expect(HttpMethod.Put, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'))
        .expect(
          HttpMethod.Patch,
          SHOP_LISTING_URL,
          fixtureResponse(FIXTURES, 'listing-active.json'),
        );

      const updated = await connector.update(
        session,
        LISTING_ID,
        mugDraft({ imagesChanged: false }),
      );

      expect(form(http.requests[1])).not.toHaveProperty('quantity');
      expect(form(http.requests[1])).not.toHaveProperty('readiness_state_id');
      expect(form(http.requests[1]).title).toBe('Speckled stoneware mug <handmade>');
      expect(form(http.requests[3])).toEqual({ state: 'active' });
      expect(updated).toMatchObject({ externalId: LISTING_ID, active: true });
      http.assertDone();
    });

    it('replaces changed images and deletes the ones past the product’s last', async () => {
      const { connector, http, session } = createEtsyTestKit();
      const draft = mugDraft();
      const oneImage = {
        ...draft,
        product: { ...draft.product, images: draft.product.images.slice(0, 1) },
      };
      http
        .expect(HttpMethod.Get, LISTING_URL, fixtureResponse(FIXTURES, 'listing-active.json'))
        .expect(
          HttpMethod.Patch,
          SHOP_LISTING_URL,
          fixtureResponse(FIXTURES, 'listing-active.json'),
        )
        .expect(HttpMethod.Get, IMAGES_URL, fixtureResponse(FIXTURES, 'listing-images.json'))
        .expect(
          HttpMethod.Post,
          UPLOAD_IMAGE_URL,
          fixtureResponse(FIXTURES, 'image-uploaded.json', 201),
        )
        .expect(HttpMethod.Delete, `${UPLOAD_IMAGE_URL}/4400002`, jsonResponse('', 204))
        .expect(HttpMethod.Put, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'));

      const updated = await connector.update(session, LISTING_ID, oneImage);

      expect(multipartText(http.requests[3])).toContain('name="overwrite"\r\n\r\ntrue\r\n');
      expect(updated.active).toBe(true);
      http.assertDone();
    });

    it('deactivates the listing of a product that is no longer active', async () => {
      const { connector, http, session } = createEtsyTestKit();
      const draft = mugDraft({ imagesChanged: false });
      http
        .expect(HttpMethod.Get, LISTING_URL, fixtureResponse(FIXTURES, 'listing-active.json'))
        .expect(
          HttpMethod.Patch,
          SHOP_LISTING_URL,
          fixtureResponse(FIXTURES, 'listing-active.json'),
        )
        .expect(HttpMethod.Put, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'))
        .expect(
          HttpMethod.Patch,
          SHOP_LISTING_URL,
          fixtureResponse(FIXTURES, 'listing-inactive.json'),
        );

      const updated = await connector.update(session, LISTING_ID, {
        ...draft,
        product: { ...draft.product, active: false },
      });

      expect(form(http.requests[3])).toEqual({ state: 'inactive' });
      expect(updated.active).toBe(false);
    });

    it('fails when Etsy no longer has the listing', async () => {
      const { connector, http, session } = createEtsyTestKit();
      http.expect(HttpMethod.Get, LISTING_URL, jsonResponse({ error: 'Listing not found' }, 404));

      await expect(connector.update(session, LISTING_ID, mugDraft())).rejects.toMatchObject({
        code: ChannelErrorCode.RequestRejected,
        message: expect.stringContaining('no longer exists'),
      });
    });
  });

  describe('delist', () => {
    it('deactivates an active listing and leaves any other alone', async () => {
      const { connector, http, session } = createEtsyTestKit();
      http
        .expect(HttpMethod.Get, LISTING_URL, fixtureResponse(FIXTURES, 'listing-active.json'))
        .expect(
          HttpMethod.Patch,
          SHOP_LISTING_URL,
          fixtureResponse(FIXTURES, 'listing-inactive.json'),
        )
        .expect(HttpMethod.Get, LISTING_URL, fixtureResponse(FIXTURES, 'listing-inactive.json'));

      await connector.delist(session, LISTING_ID);
      await connector.delist(session, LISTING_ID);

      expect(form(http.requests[1])).toEqual({ state: 'inactive' });
      expect(http.requests).toHaveLength(3);
      expect(loadFixture(FIXTURES, 'listing-inactive.json')).toContain('"state": "inactive"');
    });
  });
});
