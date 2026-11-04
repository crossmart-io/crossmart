import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ChannelConnectorRegistry, ChannelType, ChannelWebhookKind } from '@crossmart/connectors';
import { ActivityActorType, ChannelConnectionStatus } from '@crossmart/database';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { connectionRecord } from '../testing/channel-connection.fixtures.js';
import { FAKE_ACCOUNT, FakeOAuthConnector } from '../testing/fake-oauth-connector.js';
import { ChannelEventBus } from '../../events/services/channel-event-bus.js';
import { ChannelWebhooksService } from './channel-webhooks.service.js';

const WEBHOOK = { rawBody: Buffer.from('{}'), headers: {} };

function setup() {
  const connector = new FakeOAuthConnector();
  const connections = {
    findByAccount: vi.fn<ChannelConnectionRepository['findByAccount']>().mockResolvedValue([
      connectionRecord({ id: 'c-1', workspaceId: 'ws-1' }),
      connectionRecord({ id: 'c-2', workspaceId: 'ws-2' }),
      connectionRecord({
        id: 'c-3',
        workspaceId: 'ws-3',
        status: ChannelConnectionStatus.DISCONNECTED,
      }),
    ]),
    markDisconnected: vi
      .fn<ChannelConnectionRepository['markDisconnected']>()
      .mockResolvedValue(connectionRecord()),
    redactAccount: vi.fn<ChannelConnectionRepository['redactAccount']>().mockResolvedValue(1),
  };
  const activity = new InMemoryActivityRecorder();
  const events = new ChannelEventBus();
  const orderChanged = vi.spyOn(events, 'orderChanged');
  const service = new ChannelWebhooksService(
    new ChannelConnectorRegistry([connector]),
    connections as unknown as ChannelConnectionRepository,
    activity,
    events,
  );
  const deliver = (kind: ChannelWebhookKind, resourceId?: string) => {
    connector.webhookEvent = {
      kind,
      topic: 'topic',
      externalAccountId: FAKE_ACCOUNT,
      deliveryId: 'd-1',
      payload: {},
      resourceId,
    };
    return service.handle(ChannelType.Shopify, WEBHOOK);
  };
  return { service, connector, connections, activity, deliver, orderChanged };
}

describe('ChannelWebhooksService', () => {
  it('rejects deliveries whose signature does not verify', async () => {
    const { service } = setup();

    await expect(service.handle(ChannelType.Shopify, WEBHOOK)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('404s channels that do not send webhooks', async () => {
    const connector = new FakeOAuthConnector();
    connector.capabilities = new Set();
    const service = new ChannelWebhooksService(
      new ChannelConnectorRegistry([connector]),
      {} as ChannelConnectionRepository,
      new InMemoryActivityRecorder(),
      new ChannelEventBus(),
    );

    await expect(service.handle(ChannelType.Shopify, WEBHOOK)).rejects.toThrow(NotFoundException);
  });

  it('disconnects every connected workspace on uninstall, crediting the system', async () => {
    const { deliver, connections, activity } = setup();

    await deliver(ChannelWebhookKind.AccountDisconnected);

    expect(connections.findByAccount).toHaveBeenCalledWith({
      channel: ChannelType.Shopify,
      externalAccountId: FAKE_ACCOUNT,
    });
    expect(connections.markDisconnected.mock.calls.map(([id]) => id)).toEqual(['c-1', 'c-2']);
    expect(activity.recorded.map(({ workspaceId }) => workspaceId)).toEqual(['ws-1', 'ws-2']);
    expect(activity.recorded[0].actor.type).toBe(ActivityActorType.SYSTEM);
    expect(activity.entries[0].action).toBe(ActivityAction.ChannelDisconnected);
  });

  it('erases account data on shop redaction and acknowledges customer requests', async () => {
    const { deliver, connections } = setup();

    await deliver(ChannelWebhookKind.AccountRedactionRequested);
    await deliver(ChannelWebhookKind.CustomerDataRequested);
    await deliver(ChannelWebhookKind.CustomerRedactionRequested);
    await deliver(ChannelWebhookKind.Unhandled);

    expect(connections.redactAccount).toHaveBeenCalledTimes(1);
    expect(connections.markDisconnected).not.toHaveBeenCalled();
  });

  it('tells every connected workspace of the store that one of its orders changed', async () => {
    const { deliver, orderChanged } = setup();

    await deliver(ChannelWebhookKind.OrderChanged, 'gid://shopify/Order/1');
    await deliver(ChannelWebhookKind.OrderChanged);

    expect(orderChanged.mock.calls.map(([event]) => event)).toEqual([
      { workspaceId: 'ws-1', connectionId: 'c-1', externalOrderId: 'gid://shopify/Order/1' },
      { workspaceId: 'ws-2', connectionId: 'c-2', externalOrderId: 'gid://shopify/Order/1' },
    ]);
  });
});
