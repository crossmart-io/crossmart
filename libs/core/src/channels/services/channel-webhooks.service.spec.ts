import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InMemoryReplayGuard } from '@crossmart/common';
import { ChannelConnectorRegistry, ChannelType, ChannelWebhookKind } from '@crossmart/connectors';
import { ActivityActorType, ChannelConnectionStatus } from '@crossmart/database';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import { connectionRecord } from '../testing/channel-connection.fixtures.js';
import { FAKE_ACCOUNT, FakeOAuthConnector } from '../testing/fake-oauth-connector.js';
import { ChannelEventBus } from '../../events/services/channel-event-bus.js';
import { ChannelWebhookDispatcher } from './channel-webhook.dispatcher.js';
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
    new ChannelWebhookDispatcher(
      connections as unknown as ChannelConnectionRepository,
      activity,
      events,
    ),
    new InMemoryReplayGuard(),
  );
  let deliveries = 0;
  const deliver = (
    kind: ChannelWebhookKind,
    resourceId?: string,
    deliveryId: string | null = `d-${(deliveries += 1)}`,
  ) => {
    connector.webhookEvent = {
      kind,
      topic: 'topic',
      externalAccountId: FAKE_ACCOUNT,
      deliveryId,
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
      {} as ChannelWebhookDispatcher,
      new InMemoryReplayGuard(),
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
    expect(
      connections.markDisconnected.mock.calls.map(([workspaceId, id]) => [workspaceId, id]),
    ).toEqual([
      ['ws-1', 'c-1'],
      ['ws-2', 'c-2'],
    ]);
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

  it('handles a delivery id once, and acknowledges repeats', async () => {
    const { deliver, connections } = setup();

    await deliver(ChannelWebhookKind.AccountRedactionRequested, undefined, 'same');
    await deliver(ChannelWebhookKind.AccountRedactionRequested, undefined, 'same');

    expect(connections.redactAccount).toHaveBeenCalledTimes(1);
  });

  it('handles a delivery again after it failed, so the channel’s retry works', async () => {
    const { deliver, connections } = setup();
    connections.redactAccount.mockRejectedValueOnce(new Error('database down'));

    await expect(
      deliver(ChannelWebhookKind.AccountRedactionRequested, undefined, 'retried'),
    ).rejects.toThrow('database down');
    await deliver(ChannelWebhookKind.AccountRedactionRequested, undefined, 'retried');

    expect(connections.redactAccount).toHaveBeenCalledTimes(2);
  });

  it('handles every delivery without an id', async () => {
    const { deliver, connections } = setup();

    await deliver(ChannelWebhookKind.AccountRedactionRequested, undefined, null);
    await deliver(ChannelWebhookKind.AccountRedactionRequested, undefined, null);

    expect(connections.redactAccount).toHaveBeenCalledTimes(2);
  });
});
