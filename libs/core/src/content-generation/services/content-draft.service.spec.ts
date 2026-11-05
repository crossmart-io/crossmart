import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ChannelType } from '@crossmart/connectors';
import { AiFeature } from '../../ai/enums/ai-feature.enum.js';
import { AiNotConfiguredError, AiOutputRejectedError } from '../../ai/errors/ai.errors.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import type { AiUsageService } from '../../ai/services/ai-usage.service.js';
import { FakeAiProvider } from '../../ai/testing/fake-ai.provider.js';
import { unlimitedEntitlements } from '../../ai/testing/unlimited-entitlements.js';
import type { ProductsService } from '../../catalog/services/products.service.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ListingContentReader } from '../../listings/services/listing-content.reader.js';
import { productDetail } from '../../listings/testing/listing.fixtures.js';
import type { ContentDraftRequest } from '../entities/content-draft.js';
import { ContentField } from '../enums/content-field.enum.js';
import { CONNECTION_ID, PRODUCT_ID, WORKSPACE_ID } from '../testing/content-target.fixtures.js';
import { ContentDraftService } from './content-draft.service.js';

const STORE_CONTENT = { title: 'Mug on eBay', descriptionHtml: '<p>eBay text.</p>' };

function request(overrides: Partial<ContentDraftRequest> = {}): ContentDraftRequest {
  return {
    workspaceId: WORKSPACE_ID,
    productId: PRODUCT_ID,
    connectionId: null,
    fields: [ContentField.Title],
    instruction: null,
    current: {},
    ...overrides,
  };
}

function setup(channel = ChannelType.Ebay) {
  const provider = new FakeAiProvider();
  const usage = { record: vi.fn<AiUsageService['record']>().mockResolvedValue() };
  const product = productDetail();
  const products = { get: vi.fn<ProductsService['get']>().mockResolvedValue(product) };
  const connections = {
    get: vi
      .fn<ChannelConnectionsService['get']>()
      .mockResolvedValue({ id: CONNECTION_ID, channel } as ChannelConnectionView),
  };
  const listings = {
    read: vi
      .fn<ListingContentReader['read']>()
      .mockResolvedValue({ product, content: STORE_CONTENT }),
  };
  const service = new ContentDraftService(
    new AiGateway(provider, usage as unknown as AiUsageService, unlimitedEntitlements()),
    products as unknown as ProductsService,
    connections as unknown as ChannelConnectionsService,
    listings as unknown as ListingContentReader,
  );
  return { service, provider, usage, products, listings };
}

describe('ContentDraftService', () => {
  it('rewrites the catalog title only, from the text being edited, and meters the call', async () => {
    const { service, provider, usage } = setup();
    provider.answerWith({ title: '<b>Acme</b> Stoneware Mug' });

    const draft = await service.draft(
      request({ instruction: 'Shorter', current: { title: 'My unsaved title' } }),
    );

    expect(draft).toEqual({ title: 'Acme Stoneware Mug', descriptionHtml: null });
    const [sent] = provider.requests;
    expect(sent.system).toContain('product catalog');
    expect(sent.prompt).toContain('Rewrite the title of this product.');
    expect(sent.prompt).toContain('<merchant_instruction>\nShorter\n</merchant_instruction>');
    expect(sent.prompt).toContain('"title":"My unsaved title"');
    expect(usage.record).toHaveBeenCalledWith(
      expect.objectContaining({ feature: AiFeature.ContentDraft }),
    );
  });

  it('writes both fields for a store, within its rules, starting from what it shows', async () => {
    const { service, provider } = setup();
    provider.answerWith({
      title: 'Acme Stoneware Mug Blue',
      descriptionHtml: '<p>See <a href="https://x.example">site</a></p>',
    });

    const draft = await service.draft(
      request({
        connectionId: CONNECTION_ID,
        fields: [ContentField.Title, ContentField.Description],
      }),
    );

    expect(draft).toEqual({ title: 'Acme Stoneware Mug Blue', descriptionHtml: '<p>See site</p>' });
    const [sent] = provider.requests;
    expect(sent.system).toContain('at most 80 characters');
    expect(sent.prompt).toContain('Rewrite the title and description of this product.');
    expect(sent.prompt).toContain('"title":"Mug on eBay"');
    expect(sent.prompt).not.toContain('merchant_instruction');
  });

  it('rejects a title over the store’s limit', async () => {
    const { service, provider } = setup();
    provider.answerWith({ title: 'x'.repeat(81) });

    await expect(service.draft(request({ connectionId: CONNECTION_ID }))).rejects.toThrow(
      AiOutputRejectedError,
    );
  });

  it('rejects an answer left empty once cleaned', async () => {
    const { service, provider } = setup();
    provider.answerWith({ descriptionHtml: '<script>only()</script>' });

    await expect(service.draft(request({ fields: [ContentField.Description] }))).rejects.toThrow(
      AiOutputRejectedError,
    );
  });

  it('refuses a channel without content rules', async () => {
    const { service } = setup(ChannelType.Amazon);

    await expect(service.draft(request({ connectionId: CONNECTION_ID }))).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('answers 404 once the product is gone from the store', async () => {
    const { service, listings } = setup();
    listings.read.mockResolvedValue(null);

    await expect(service.draft(request({ connectionId: CONNECTION_ID }))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('refuses before loading anything while AI is not configured', async () => {
    const { service, provider, products } = setup();
    provider.setConfigured(false);

    await expect(service.draft(request())).rejects.toThrow(AiNotConfiguredError);
    expect(products.get).not.toHaveBeenCalled();
  });
});
