import { ChannelType } from '@crossmart/connectors';
import { ActivityActorType, ChannelConnectionStatus } from '@crossmart/database';
import { ActivityAction } from '../../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionRepository } from '../../repositories/channel-connection.repository.js';
import { connectionRecord } from '../../testing/channel-connection.fixtures.js';
import { EbayAccountPurger } from './ebay-account.purger.js';

const USER_ID = 'nY4uWx2bQ1e';
const NOW = new Date('2026-11-05T10:00:00Z');

function ebayConnection(id: string, externalAccountId: string, workspaceId = 'ws-1') {
  return connectionRecord({
    id,
    workspaceId,
    channel: ChannelType.Ebay,
    externalAccountId,
    displayName: 'demo_seller · eBay US',
  });
}

function setup(found = [ebayConnection('c-1', `${USER_ID}:EBAY_US`)]) {
  const connections = {
    findByAccountPrefix: vi
      .fn<ChannelConnectionRepository['findByAccountPrefix']>()
      .mockResolvedValue(found),
    redactAccount: vi.fn<ChannelConnectionRepository['redactAccount']>().mockResolvedValue(1),
  };
  const activity = new InMemoryActivityRecorder();
  const purger = new EbayAccountPurger(
    connections as unknown as ChannelConnectionRepository,
    activity,
  );
  return { purger, connections, activity };
}

describe('EbayAccountPurger', () => {
  it('redacts every marketplace account of the user, in every workspace', async () => {
    const { purger, connections } = setup([
      ebayConnection('c-1', `${USER_ID}:EBAY_US`, 'ws-1'),
      ebayConnection('c-2', `${USER_ID}:EBAY_US`, 'ws-2'),
      ebayConnection('c-3', `${USER_ID}:EBAY_GB`, 'ws-1'),
    ]);

    await expect(purger.purge(USER_ID, NOW)).resolves.toBe(3);

    expect(connections.findByAccountPrefix).toHaveBeenCalledWith(ChannelType.Ebay, `${USER_ID}:`);
    expect(connections.redactAccount.mock.calls).toEqual([
      [
        { channel: ChannelType.Ebay, externalAccountId: `${USER_ID}:EBAY_US` },
        NOW,
        'Deleted eBay account · eBay US',
      ],
      [
        { channel: ChannelType.Ebay, externalAccountId: `${USER_ID}:EBAY_GB` },
        NOW,
        'Deleted eBay account · eBay UK',
      ],
    ]);
  });

  it('leaves users whose id only starts with the deleted one alone', async () => {
    const { purger, connections } = setup([ebayConnection('c-1', `${USER_ID}:extra:EBAY_US`)]);

    await expect(purger.purge(USER_ID, NOW)).resolves.toBe(0);

    expect(connections.redactAccount).not.toHaveBeenCalled();
  });

  it('records a system disconnect without the username, only for connections still active', async () => {
    const { purger, activity } = setup([
      ebayConnection('c-1', `${USER_ID}:EBAY_US`, 'ws-1'),
      connectionRecord({
        ...ebayConnection('c-2', `${USER_ID}:EBAY_US`, 'ws-2'),
        status: ChannelConnectionStatus.DISCONNECTED,
      }),
    ]);

    await purger.purge(USER_ID, NOW);

    expect(activity.recorded).toHaveLength(1);
    const [{ workspaceId, actor, entry }] = activity.recorded;
    expect(workspaceId).toBe('ws-1');
    expect(actor.type).toBe(ActivityActorType.SYSTEM);
    expect(entry).toMatchObject({
      action: ActivityAction.ChannelDisconnected,
      subject: { id: 'c-1', label: 'Deleted eBay account · eBay US' },
    });
    expect(JSON.stringify(activity.recorded)).not.toContain('demo_seller');
  });

  it('does nothing for a user Crossmart never connected', async () => {
    const { purger, connections, activity } = setup([]);

    await expect(purger.purge(USER_ID, NOW)).resolves.toBe(0);

    expect(connections.redactAccount).not.toHaveBeenCalled();
    expect(activity.recorded).toHaveLength(0);
  });
});
