import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { FakeHttpTransport, HttpTransport } from '@crossmart/connectors';
import {
  ActivityAction,
  AI_NOT_CONFIGURED_MESSAGE,
  AiFeature,
  AiProvider,
  ContentField,
  ContentGenerationQueue,
  ContentGenerationRunner,
  SuggestionKind,
  SyncJobQueue,
  WorkspacePermission,
} from '@crossmart/core';
import { FakeAiProvider } from '@crossmart/core/ai/testing/fake-ai.provider.js';
import { ProductStatus, SuggestionStatus, WorkspaceRole } from '@crossmart/database';
import { RecordingContentGenerationQueue } from './support/recording-content-generation.queue.js';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import { connectShopifyStore } from './support/shopify-store.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

// The same fake app settings as `SHOPIFY_TEST_ENV`, set before the app module reads them.
vi.hoisted(() => {
  Object.assign(process.env, {
    SHOPIFY_CLIENT_ID: 'e2e-client-id',
    SHOPIFY_CLIENT_SECRET: 'e2e-client-secret',
    API_PUBLIC_URL: 'http://localhost:3006',
    WEB_APP_URL: 'http://localhost:5179',
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  });
});

const GENERATED = {
  title: 'Hand-glazed Stoneware Mug, 350 ml',
  titleRationale: 'Names the material and size shoppers search for.',
  descriptionHtml: '<p>Hand-glazed stoneware.</p><ul><li>350 ml</li></ul>',
  descriptionRationale: 'Leads with what makes it special, then the facts.',
};

interface SuggestionBody {
  id: string;
  kind: SuggestionKind;
  status: SuggestionStatus;
  currentValue: string;
  proposedValue: string;
}

describe('Suggestions and the Content Generator (e2e)', () => {
  let app: INestApplication<App>;
  const http = new FakeHttpTransport();
  const ai = new FakeAiProvider();
  const contentJobs = new RecordingContentGenerationQueue();
  let runner: ContentGenerationRunner;

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpTransport)
        .useValue(http)
        .overrideProvider(SyncJobQueue)
        .useValue(new RecordingSyncJobQueue())
        .overrideProvider(AiProvider)
        .useValue(ai)
        .overrideProvider(ContentGenerationQueue)
        .useValue(contentJobs),
    );
    runner = app.get(ContentGenerationRunner);
    ai.answerWith(GENERATED);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const base = (user: SignedUpUser) => `/api/v1/workspaces/${user.workspaceId}`;

  async function createProduct(user: SignedUpUser): Promise<string> {
    const response = await request(server())
      .post(`${base(user)}/products`)
      .set('Cookie', user.cookie)
      .send({
        title: 'Mug',
        descriptionHtml: '<p>A mug.</p>',
        status: ProductStatus.ACTIVE,
        variants: [{ sku: `MUG-${Date.now()}`, price: '20.00', quantity: 5 }],
      });
    expect(response.status).toBe(HttpStatus.CREATED);
    return response.body.id;
  }

  async function workspaceWithProduct(name: string) {
    const owner = await signUp(app, name);
    const connectionId = await connectShopifyStore(app, http, owner);
    const productId = await createProduct(owner);
    return { owner, connectionId, productId };
  }

  async function generate(user: SignedUpUser, connectionId: string, productId: string) {
    const response = await request(server())
      .post(`${base(user)}/ai/content-generations`)
      .set('Cookie', user.cookie)
      .send({ connectionId, productIds: [productId] });
    for (const job of contentJobs.drain()) {
      await runner.run(job, { finalAttempt: true });
    }
    return response;
  }

  async function pending(user: SignedUpUser): Promise<SuggestionBody[]> {
    const response = await request(server())
      .get(`${base(user)}/suggestions`)
      .query({ status: SuggestionStatus.PENDING })
      .set('Cookie', user.cookie);
    expect(response.status).toBe(HttpStatus.OK);
    return response.body.items;
  }

  function review(user: SignedUpUser, suggestionId: string, action: 'approve' | 'reject') {
    return request(server())
      .post(`${base(user)}/suggestions/${suggestionId}/${action}`)
      .set('Cookie', user.cookie);
  }

  function byKind(items: SuggestionBody[], kind: SuggestionKind): SuggestionBody {
    const found = items.find((item) => item.kind === kind);
    if (!found) throw new Error(`No ${kind} suggestion`);
    return found;
  }

  async function keyWithRole(owner: SignedUpUser, role: WorkspaceRole): Promise<string> {
    const created = await request(server())
      .post(`${base(owner)}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: role, role });
    return created.body.secret;
  }

  it('generates pending suggestions, and applying one writes the channel override', async () => {
    const { owner, connectionId, productId } = await workspaceWithProduct('AI Owner');

    const status = await request(server())
      .get(`${base(owner)}/ai/status`)
      .set('Cookie', owner.cookie);
    expect(status.body).toMatchObject({ configured: true });

    const queued = await generate(owner, connectionId, productId);
    expect(queued.status).toBe(HttpStatus.ACCEPTED);
    expect(queued.body).toEqual({ queued: 1 });

    const items = await pending(owner);
    expect(items).toHaveLength(2);
    const title = byKind(items, SuggestionKind.ListingTitle);
    expect(title).toMatchObject({ currentValue: 'Mug', proposedValue: GENERATED.title });

    const approved = await review(owner, title.id, 'approve');
    expect(approved.status).toBe(HttpStatus.OK);
    expect(approved.body.status).toBe(SuggestionStatus.APPLIED);
    const channels = await request(server())
      .get(`${base(owner)}/products/${productId}/channels`)
      .set('Cookie', owner.cookie);
    expect(channels.body[0].override.title).toBe(GENERATED.title);

    const again = await review(owner, title.id, 'approve');
    expect(again.status).toBe(HttpStatus.CONFLICT);

    const activity = await request(server())
      .get(`${base(owner)}/activity`)
      .set('Cookie', owner.cookie);
    const actions = activity.body.items.map((item: { action: ActivityAction }) => item.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        ActivityAction.ContentGenerationRequested,
        ActivityAction.ContentGenerated,
        ActivityAction.SuggestionApproved,
        ActivityAction.ListingOverrideUpdated,
      ]),
    );

    const usage = await request(server())
      .get(`${base(owner)}/ai/usage`)
      .set('Cookie', owner.cookie);
    expect(usage.body.lines).toEqual([
      expect.objectContaining({ feature: AiFeature.ContentGeneration, calls: 1 }),
    ]);
  });

  it('marks a suggestion stale when its field changed, and rejects without changing anything', async () => {
    const { owner, connectionId, productId } = await workspaceWithProduct('AI Stale');
    await generate(owner, connectionId, productId);
    const items = await pending(owner);
    await request(server())
      .put(`${base(owner)}/products/${productId}/channels/${connectionId}/override`)
      .set('Cookie', owner.cookie)
      .send({ descriptionHtml: '<p>Written by hand.</p>' });

    const stale = await review(
      owner,
      byKind(items, SuggestionKind.ListingDescription).id,
      'approve',
    );
    expect(stale.body.status).toBe(SuggestionStatus.STALE);

    const rejected = await review(owner, byKind(items, SuggestionKind.ListingTitle).id, 'reject');
    expect(rejected.body.status).toBe(SuggestionStatus.REJECTED);
    expect(rejected.body.review).toMatchObject({ name: 'AI Stale' });
    const channels = await request(server())
      .get(`${base(owner)}/products/${productId}/channels`)
      .set('Cookie', owner.cookie);
    expect(channels.body[0].override).toMatchObject({
      title: null,
      descriptionHtml: '<p>Written by hand.</p>',
    });
  });

  it('bulk approves pending suggestions and replaces older pending ones on regeneration', async () => {
    const { owner, connectionId, productId } = await workspaceWithProduct('AI Bulk');
    await generate(owner, connectionId, productId);
    const first = await pending(owner);
    await generate(owner, connectionId, productId);
    const second = await pending(owner);
    expect(second).toHaveLength(2);
    expect(second.map((item) => item.id)).not.toContain(first[0].id);

    const result = await request(server())
      .post(`${base(owner)}/suggestions/bulk-approve`)
      .set('Cookie', owner.cookie)
      .send({ suggestionIds: [...second.map((item) => item.id), first[0].id] });

    expect(result.status).toBe(HttpStatus.OK);
    expect(result.body.items.map((item: SuggestionBody) => item.status)).toEqual([
      SuggestionStatus.APPLIED,
      SuggestionStatus.APPLIED,
    ]);
    expect(result.body.skippedIds).toEqual([first[0].id]);
    const filtered = await request(server())
      .get(`${base(owner)}/suggestions`)
      .query({ productId, connectionId, status: SuggestionStatus.STALE })
      .set('Cookie', owner.cookie);
    expect(filtered.body.total).toBe(2);
  });

  it('checks permissions and keeps suggestions inside their workspace', async () => {
    const { owner, connectionId, productId } = await workspaceWithProduct('AI Perms');
    await generate(owner, connectionId, productId);
    const [suggestion] = await pending(owner);
    const viewerKey = await keyWithRole(owner, WorkspaceRole.VIEWER);
    const editorKey = await keyWithRole(owner, WorkspaceRole.EDITOR);

    const listed = await request(server())
      .get(`${base(owner)}/suggestions`)
      .set(API_KEY_HEADER, viewerKey);
    expect(listed.status).toBe(HttpStatus.OK);
    const viewerApproves = await request(server())
      .post(`${base(owner)}/suggestions/${suggestion.id}/approve`)
      .set(API_KEY_HEADER, viewerKey);
    expect(viewerApproves.status).toBe(HttpStatus.FORBIDDEN);
    expect(viewerApproves.body.message).toBe(
      `Requires the ${WorkspacePermission.ApproveSuggestions} permission`,
    );
    const editorApproves = await request(server())
      .post(`${base(owner)}/suggestions/${suggestion.id}/approve`)
      .set(API_KEY_HEADER, editorKey);
    expect(editorApproves.status).toBe(HttpStatus.FORBIDDEN);
    const viewerGenerates = await request(server())
      .post(`${base(owner)}/ai/content-generations`)
      .set(API_KEY_HEADER, viewerKey)
      .send({ connectionId, productIds: [productId] });
    expect(viewerGenerates.status).toBe(HttpStatus.FORBIDDEN);

    const stranger = await signUp(app, 'Stranger');
    const foreign = await request(server())
      .get(`${base(stranger)}/suggestions/${suggestion.id}`)
      .set('Cookie', stranger.cookie);
    expect(foreign.status).toBe(HttpStatus.NOT_FOUND);
    const foreignProduct = await request(server())
      .post(`${base(stranger)}/ai/content-generations`)
      .set('Cookie', stranger.cookie)
      .send({ connectionId, productIds: [productId] });
    expect(foreignProduct.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('says AI is not configured, and queues nothing, without a provider key', async () => {
    const { owner, connectionId, productId } = await workspaceWithProduct('AI Off');
    ai.setConfigured(false);
    try {
      const status = await request(server())
        .get(`${base(owner)}/ai/status`)
        .set('Cookie', owner.cookie);
      expect(status.body.configured).toBe(false);
      const refused = await generate(owner, connectionId, productId);
      expect(refused.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(refused.body.message).toBe(AI_NOT_CONFIGURED_MESSAGE);
      expect(await pending(owner)).toEqual([]);
    } finally {
      ai.setConfigured(true);
    }
  });

  it('validates requests', async () => {
    const { owner, connectionId } = await workspaceWithProduct('AI Validation');
    const responses = await Promise.all(
      [
        { connectionId, productIds: [] },
        { connectionId, productIds: ['not-a-uuid'] },
        { productIds: [connectionId] },
      ].map((body) =>
        request(server())
          .post(`${base(owner)}/ai/content-generations`)
          .set('Cookie', owner.cookie)
          .send(body),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual(
      Array(3).fill(HttpStatus.BAD_REQUEST),
    );
    const period = await request(server())
      .get(`${base(owner)}/ai/usage`)
      .query({ from: '2026-11-02T00:00:00Z' })
      .set('Cookie', owner.cookie);
    expect(period.status).toBe(HttpStatus.BAD_REQUEST);
  });
  describe('content drafts', () => {
    function draft(user: SignedUpUser, body: object, apiKey?: string) {
      const call = request(server()).post(`${base(user)}/ai/content-drafts`);
      return (apiKey ? call.set(API_KEY_HEADER, apiKey) : call.set('Cookie', user.cookie)).send(
        body,
      );
    }

    it('rewrites catalog and store fields right away, and stores nothing', async () => {
      const { owner, connectionId, productId } = await workspaceWithProduct('Draft Owner');

      const catalog = await draft(owner, {
        productId,
        fields: [ContentField.Title, ContentField.Description],
        instruction: 'Mention the size',
        title: 'Unsaved mug title',
      });
      const store = await draft(owner, { productId, connectionId, fields: [ContentField.Title] });

      expect(catalog.status).toBe(HttpStatus.OK);
      expect(catalog.body).toEqual({
        title: GENERATED.title,
        descriptionHtml: GENERATED.descriptionHtml,
      });
      expect(store.status).toBe(HttpStatus.OK);
      expect(store.body).toEqual({ title: GENERATED.title, descriptionHtml: null });
      const product = await request(server())
        .get(`${base(owner)}/products/${productId}`)
        .set('Cookie', owner.cookie);
      expect(product.body.title).toBe('Mug');
      expect(await pending(owner)).toEqual([]);
      const usage = await request(server())
        .get(`${base(owner)}/ai/usage`)
        .set('Cookie', owner.cookie);
      expect(JSON.stringify(usage.body)).toContain(AiFeature.ContentDraft);
    });

    it('checks permissions, the workspace and the request', async () => {
      const { owner, productId } = await workspaceWithProduct('Draft Perms');
      const viewerKey = await keyWithRole(owner, WorkspaceRole.VIEWER);
      const stranger = await signUp(app, 'Draft Stranger');
      const fields = [ContentField.Title];

      expect((await draft(owner, { productId, fields }, viewerKey)).status).toBe(
        HttpStatus.FORBIDDEN,
      );
      expect((await draft(stranger, { productId, fields })).status).toBe(HttpStatus.NOT_FOUND);
      const invalid = await Promise.all(
        [
          { productId, fields: [] },
          { productId, fields: ['price'] },
          { productId, fields, instruction: 'x'.repeat(501) },
          { fields },
        ].map((body) => draft(owner, body)),
      );
      expect(invalid.map((response) => response.status)).toEqual(
        Array(4).fill(HttpStatus.BAD_REQUEST),
      );
    });

    it('says AI is not configured without a provider key', async () => {
      const { owner, productId } = await workspaceWithProduct('Draft Off');
      ai.setConfigured(false);
      try {
        const refused = await draft(owner, { productId, fields: [ContentField.Title] });
        expect(refused.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect(refused.body.message).toBe(AI_NOT_CONFIGURED_MESSAGE);
      } finally {
        ai.setConfigured(true);
      }
    });
  });
});
