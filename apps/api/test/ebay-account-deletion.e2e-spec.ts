import { createHash, randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  ChannelType,
  FakeEbayNotificationSigner,
  FakeHttpTransport,
  HttpMethod,
  HttpTransport,
  jsonResponse,
} from '@crossmart/connectors';
import { ActivityAction } from '@crossmart/core';
import { ChannelConnectionStatus, PrismaService } from '@crossmart/database';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

// Set before the app module loads its configuration. The values are fakes for this test only.
const env = vi.hoisted(() => {
  const values = {
    EBAY_CLIENT_ID: 'e2e-ebay-app-id',
    EBAY_CLIENT_SECRET: 'e2e-ebay-cert-id',
    EBAY_RU_NAME: 'E2E_Seller-E2EApp-SBX-abcdef',
    EBAY_ENVIRONMENT: 'sandbox',
    EBAY_VERIFICATION_TOKEN: 'e2e_verification-token_0123456789abcdef',
    API_PUBLIC_URL: 'https://api.e2e.example.com',
  };
  Object.assign(process.env, values);
  return values;
});

const ROUTE = '/api/v1/webhooks/ebay/account-deletion';
const ENDPOINT = `${env.API_PUBLIC_URL}${ROUTE}`;
const TOKEN_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
const PUBLIC_KEY_URL = 'https://api.sandbox.ebay.com/commerce/notification/v1/public_key/';
const KEY_ID = randomUUID();

function deletionNotice(userId: string) {
  return {
    metadata: { topic: 'MARKETPLACE_ACCOUNT_DELETION', schemaVersion: '1.0', deprecated: false },
    notification: {
      notificationId: randomUUID(),
      eventDate: '2026-11-05T09:58:12.104Z',
      publishDate: '2026-11-05T09:58:12.381Z',
      publishAttemptCount: 1,
      data: {
        username: 'e2e_deleted_seller',
        userId,
        eiasToken: 'nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6w==',
      },
    },
  };
}

describe('eBay marketplace account deletion (e2e)', () => {
  let app: INestApplication<App>;
  const http = new FakeHttpTransport();
  const signer = new FakeEbayNotificationSigner(KEY_ID);

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(HttpTransport).useValue(http));
    http
      .expect(
        HttpMethod.Post,
        TOKEN_URL,
        jsonResponse({
          access_token: 'e2e-app-token',
          expires_in: 7200,
          token_type: 'Application Access Token',
        }),
      )
      .expect(
        HttpMethod.Get,
        `${PUBLIC_KEY_URL}${KEY_ID}`,
        jsonResponse(signer.publicKeyResponse()),
      );
  });

  afterAll(async () => {
    await app.close();
  });

  function deliver(body: string, signatureHeader?: string) {
    const delivery = request(app.getHttpServer())
      .post(ROUTE)
      .set('Content-Type', 'application/json');
    return (signatureHeader ? delivery.set('X-EBAY-SIGNATURE', signatureHeader) : delivery).send(
      body,
    );
  }

  async function connectEbay(owner: SignedUpUser, externalAccountId: string) {
    return app.get(PrismaService).channelConnection.create({
      data: {
        workspaceId: owner.workspaceId,
        channel: ChannelType.Ebay,
        externalAccountId,
        displayName: 'e2e_deleted_seller · eBay US',
        credentials: 'sealed-credentials',
        grantedScopes: ['https://api.ebay.com/oauth/api_scope'],
        settings: { account: { channel: ChannelType.Ebay, username: 'e2e_deleted_seller' } },
      },
    });
  }

  it('answers the endpoint challenge with the hash of the code, the token and the URL', async () => {
    const response = await request(app.getHttpServer())
      .get(ROUTE)
      .query({ challenge_code: 'e2e-challenge-123' });

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    const expected = createHash('sha256')
      .update(`e2e-challenge-123${env.EBAY_VERIFICATION_TOKEN}${ENDPOINT}`)
      .digest('hex');
    expect(response.body).toEqual({ challengeResponse: expected });
  });

  it('refuses a challenge without a code', async () => {
    const response = await request(app.getHttpServer()).get(ROUTE);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('purges every connection of a deleted user on a verified notice', async () => {
    const userId = `e2e${randomUUID().slice(0, 8)}`;
    const owner = await signUp(app, 'Deleted eBay Seller');
    const other = await signUp(app, 'Other Workspace');
    const connections = [
      await connectEbay(owner, `${userId}:EBAY_US`),
      await connectEbay(other, `${userId}:EBAY_US`),
    ];
    const bystander = await connectEbay(owner, `other${userId}:EBAY_US`);
    const body = JSON.stringify(deletionNotice(userId));

    const response = await deliver(body, signer.signatureHeader(body));

    expect(response.status).toBe(HttpStatus.NO_CONTENT);
    http.assertDone();
    const prisma = app.get(PrismaService);
    for (const { id } of connections) {
      const stored = await prisma.channelConnection.findUniqueOrThrow({ where: { id } });
      expect(stored).toMatchObject({
        status: ChannelConnectionStatus.DISCONNECTED,
        credentials: null,
        settings: {},
        grantedScopes: [],
        displayName: 'Deleted eBay account · eBay US',
      });
    }
    const untouched = await prisma.channelConnection.findUniqueOrThrow({
      where: { id: bystander.id },
    });
    expect(untouched.status).toBe(ChannelConnectionStatus.CONNECTED);
    const activity = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/activity`)
      .set('Cookie', owner.cookie);
    expect(activity.body.items[0]).toMatchObject({ action: ActivityAction.ChannelDisconnected });
    expect(activity.text).not.toContain('e2e_deleted_seller');
  });

  it('acknowledges a verified notice about a user Crossmart never connected', async () => {
    const body = JSON.stringify(deletionNotice('neverConnected'));

    expect((await deliver(body, signer.signatureHeader(body))).status).toBe(HttpStatus.NO_CONTENT);
  });

  it('answers 412 to a tampered, unsigned or foreign-signed notice and purges nothing', async () => {
    const userId = `e2e${randomUUID().slice(0, 8)}`;
    const owner = await signUp(app, 'Protected eBay Seller');
    const connection = await connectEbay(owner, `${userId}:EBAY_US`);
    const body = JSON.stringify(deletionNotice(userId));
    const impostor = new FakeEbayNotificationSigner(KEY_ID);
    const signedOther = JSON.stringify(deletionNotice('someoneElse'));

    for (const [payload, header] of [
      [body, signer.signatureHeader(signedOther)],
      [body, undefined],
      [body, impostor.signatureHeader(body)],
    ] as const) {
      expect((await deliver(payload, header)).status).toBe(HttpStatus.PRECONDITION_FAILED);
    }
    const stored = await app
      .get(PrismaService)
      .channelConnection.findUniqueOrThrow({ where: { id: connection.id } });
    expect(stored.status).toBe(ChannelConnectionStatus.CONNECTED);
    expect(stored.credentials).toBe('sealed-credentials');
  });
});
