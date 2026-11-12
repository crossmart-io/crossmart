import { ChannelWebhookKind } from '../../sdk/capabilities/webhook-receiver.js';
import { loadFixture } from '../../sdk/testing/fixtures.js';
import { createMercadoLibreTestKit, FIXTURES, fixtureJson } from '../mercadolibre.fixtures.js';
import { MercadoLibreApp } from '../mercadolibre-app.js';

function webhook(body: unknown) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return { rawBody: Buffer.from(raw), headers: { 'content-type': 'application/json' } };
}

describe('Mercado Libre notifications', () => {
  it('reads an orders_v2 notification as the order to read again', () => {
    const { connector } = createMercadoLibreTestKit();

    const event = connector.verifyWebhook(
      webhook(loadFixture(FIXTURES, 'notification-order.json')),
    );

    expect(event).toMatchObject({
      kind: ChannelWebhookKind.OrderChanged,
      topic: 'orders_v2',
      externalAccountId: '468424240',
      deliveryId: 'f9f08571-1f65-4c46-9e0a-c0f43faas1557e',
      resourceId: '2195160686',
    });
  });

  it('acknowledges other topics of the app without acting on them', () => {
    const { connector } = createMercadoLibreTestKit();
    const item = { ...fixtureJson('notification-item.json'), application_id: '5503910054141466' };

    expect(connector.verifyWebhook(webhook(item))).toMatchObject({
      kind: ChannelWebhookKind.Unhandled,
      topic: 'items',
      externalAccountId: '123456789',
    });
  });

  it('refuses notifications for another app, bodies that are not one, and an unconfigured app', () => {
    const { connector } = createMercadoLibreTestKit();
    const unconfigured = createMercadoLibreTestKit(new MercadoLibreApp(null)).connector;
    const order = loadFixture(FIXTURES, 'notification-order.json');

    expect(
      connector.verifyWebhook(webhook(loadFixture(FIXTURES, 'notification-item.json'))),
    ).toBeNull();
    expect(connector.verifyWebhook(webhook('not json'))).toBeNull();
    expect(connector.verifyWebhook(webhook({ topic: 'orders_v2' }))).toBeNull();
    expect(unconfigured.verifyWebhook(webhook(order))).toBeNull();
  });
});
