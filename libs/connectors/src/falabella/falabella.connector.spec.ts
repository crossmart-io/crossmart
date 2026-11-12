import { ChannelAuthStrategy } from '../sdk/channel-auth-strategy.enum.js';
import { ChannelCapability } from '../sdk/channel-capability.enum.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import { PublishRequirement } from '../sdk/publishing/publish-requirement.enum.js';
import { CategoryAspectMode } from '../sdk/capabilities/taxonomy-provider.js';
import { describeConnectorContract } from '../sdk/testing/connector-contract.js';
import { FalabellaAction, FalabellaCountry, FalabellaCredentialField } from './falabella.enums.js';
import {
  actionUrl,
  API_KEY,
  createFalabellaTestKit,
  falabellaSession,
  falabellaSettings,
  pastedCredentials,
  SELLER_ID,
  sentParam,
  USER_ID,
  xmlFixture,
} from './falabella.fixtures.js';
import { isFalabellaSettings } from './falabella-settings.js';

describeConnectorContract(() => createFalabellaTestKit().connector, {
  validAccountHandle: SELLER_ID,
  invalidAccountHandles: [],
});

describe('FalabellaConnector', () => {
  it('declares what it does and the credentials a merchant pastes', () => {
    const { connector } = createFalabellaTestKit();

    expect(connector.channel).toBe(ChannelType.Falabella);
    expect(connector.authStrategy).toBe(ChannelAuthStrategy.SellerCredentials);
    expect(connector.isConfigured()).toBe(true);
    expect([...connector.capabilities]).toEqual([
      ChannelCapability.PublishListings,
      ChannelCapability.UpdatePrice,
      ChannelCapability.ProvideTaxonomy,
      ChannelCapability.FetchOrders,
      ChannelCapability.UpdateInventory,
    ]);
    expect(connector.credentialFields.map((field) => [field.key, field.secret])).toEqual([
      [FalabellaCredentialField.SellerId, false],
      [FalabellaCredentialField.UserId, false],
      [FalabellaCredentialField.ApiKey, true],
      [FalabellaCredentialField.Country, false],
    ]);
    expect(connector.rateLimits).toEqual([
      expect.objectContaining({ capacity: 500, restorePerSecond: 10 / 120 }),
    ]);
  });

  describe('verifyCredentials', () => {
    it('checks the key with a signed FeedCount and names the account by seller and country', async () => {
      const { connector, http } = createFalabellaTestKit();
      http.expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.FeedCount),
        xmlFixture('feed-count.xml'),
      );

      const verified = await connector.verifyCredentials(pastedCredentials());

      expect(verified).toEqual({
        externalAccountId: `${SELLER_ID}:${FalabellaCountry.Chile}`,
        credentials: { accessToken: API_KEY },
        grantedScopes: [],
        profile: { displayName: `${SELLER_ID} (Chile)`, settings: falabellaSettings() },
      });
      const [request] = http.requests;
      expect(sentParam(http, 0, 'UserID')).toBe(USER_ID);
      expect(sentParam(http, 0, 'Version')).toBe('1.0');
      expect(sentParam(http, 0, 'Signature')).toMatch(/^[0-9a-f]{64}$/);
      expect(request?.url).not.toContain(API_KEY);
      expect(request?.headers?.['user-agent']).toMatch(
        new RegExp(`^${SELLER_ID}/Node/[\\d.]+/CROSSMART/FACL$`),
      );
      http.assertDone();
    });

    it('says the key was rejected when Falabella fails the signature', async () => {
      const { connector, http } = createFalabellaTestKit();
      http.expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.FeedCount),
        xmlFixture('error-login.xml', 400),
      );

      await expect(connector.verifyCredentials(pastedCredentials())).rejects.toMatchObject({
        code: ChannelErrorCode.CredentialsRejected,
        message: expect.stringContaining('E007: Login failed'),
      });
    });

    it('refuses a malformed seller id or an unknown country before calling Falabella', async () => {
      const { connector, http } = createFalabellaTestKit();

      await expect(
        connector.verifyCredentials(pastedCredentials({ sellerId: 'SC 478' })),
      ).rejects.toMatchObject({ code: ChannelErrorCode.InvalidAccount });
      await expect(
        connector.verifyCredentials(pastedCredentials({ country: 'famx' })),
      ).rejects.toMatchObject({ code: ChannelErrorCode.InvalidAccount });
      expect(http.requests).toEqual([]);
    });
  });

  it('describes a stored account from its settings and key', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    http.expect(HttpMethod.Get, actionUrl(FalabellaAction.FeedCount), xmlFixture('feed-count.xml'));

    const profile = await connector.describeAccount(session);

    expect(profile.settings).toEqual(falabellaSettings());
    expect(isFalabellaSettings(profile.settings)).toBe(true);
    await expect(connector.describeAccount(falabellaSession(null))).rejects.toMatchObject({
      code: ChannelErrorCode.CredentialsRejected,
    });
  });

  it('validates stored settings', () => {
    const { connector } = createFalabellaTestKit();

    expect(connector.parseSettings(falabellaSettings())).toEqual(falabellaSettings());
    expect(() => connector.parseSettings({ ...falabellaSettings(), country: 'famx' })).toThrow(
      /country/,
    );
  });

  it('asks for a store reconnect without settings, and for an https image', () => {
    const { connector } = createFalabellaTestKit();
    const candidate = { active: true, optionNames: [], variantCount: 1 };

    expect(connector.unmetAccountRequirements(null)).toEqual([
      expect.objectContaining({ requirement: PublishRequirement.AccountSettings }),
    ]);
    expect(connector.unmetAccountRequirements(falabellaSettings())).toEqual([]);
    expect(
      connector.unmetProductRequirements({ ...candidate, imageUrls: ['http://cdn.example/a.jpg'] }),
    ).toEqual([expect.objectContaining({ requirement: PublishRequirement.Images })]);
    expect(
      connector.unmetProductRequirements({
        ...candidate,
        imageUrls: ['https://cdn.example/a.jpg'],
      }),
    ).toEqual([]);
  });

  describe('taxonomy', () => {
    it('suggests leaf categories with their path, reading the tree once', async () => {
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
        )
        .expect(
          HttpMethod.Get,
          actionUrl(FalabellaAction.GetCategorySuggestion),
          xmlFixture('error-format.xml', 400),
        );

      const squares = await connector.suggestCategories(session, 'Square mirror');
      const again = await connector.suggestCategories(session, 'Quadrilaterals');

      expect(squares).toEqual([{ id: '603', name: 'Quadrilaterals > Rectangles > Squares' }]);
      expect(again).toEqual(squares);
      expect(sentParam(http, 1, 'Name')).toBe('Square mirror');
      http.assertDone();
    });

    it('lists the attributes a merchant sets, with the package size every product needs', async () => {
      const { connector, http, session } = createFalabellaTestKit();
      http.expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.GetCategoryAttributes),
        xmlFixture('category-attributes.xml'),
      );

      const aspects = await connector.categoryAspects(session, '603');

      expect(sentParam(http, 0, 'PrimaryCategory')).toBe('603');
      expect(aspects.map((aspect) => [aspect.name, aspect.required])).toEqual([
        ['Package height (cm)', true],
        ['Package width (cm)', true],
        ['Package length (cm)', true],
        ['Package weight (kg)', true],
        ['Memory Size (GB)', false],
        ['Processor', false],
        ['TaxClass', false],
        ['ShipmentType', false],
        ['Condition', false],
      ]);
      expect(aspects.find((aspect) => aspect.name === 'Processor')).toMatchObject({
        mode: CategoryAspectMode.SelectionOnly,
        values: ['Intel', 'AMD', 'NVIDIA'],
      });
    });

    it('asks Colombian sellers for the tax percentage too', async () => {
      const { connector, http } = createFalabellaTestKit();
      http.expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.GetCategoryAttributes),
        xmlFixture('category-attributes.xml'),
      );
      const colombia = falabellaSession(falabellaSettings({ country: FalabellaCountry.Colombia }));

      const aspects = await connector.categoryAspects(colombia, '603');

      expect(aspects.map((aspect) => aspect.name)).toContain('Tax percentage');
      expect(http.requests[0]?.headers?.['user-agent']).toMatch(/\/FACO$/);
    });
  });
});
