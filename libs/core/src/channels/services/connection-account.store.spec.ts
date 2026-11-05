import { NotFoundException } from '@nestjs/common';
import { ChannelType } from '@crossmart/connectors';
import { connectionView } from '../../listings/testing/listing.fixtures.js';
import type { ChannelConnectionRepository } from '../repositories/channel-connection.repository.js';
import {
  CONNECTION_ID,
  connectionRecord,
  WORKSPACE_ID,
} from '../testing/channel-connection.fixtures.js';
import type { ChannelConnectionsService } from './channel-connections.service.js';
import { ConnectionAccountStore } from './connection-account.store.js';

const PRICING = { adjustmentPercent: '10' };

function setup() {
  // The view was read before the merchant saved a pricing rule: it must not be written back.
  const staleView = connectionView({ id: CONNECTION_ID });
  const fresh = connectionView({ id: CONNECTION_ID });
  const connections = { get: vi.fn<ChannelConnectionsService['get']>().mockResolvedValue(fresh) };
  const records = {
    saveAccountSettings: vi
      .fn<ChannelConnectionRepository['saveAccountSettings']>()
      .mockResolvedValue(connectionRecord({ settings: { pricing: PRICING } })),
  };
  const store = new ConnectionAccountStore(
    connections as unknown as ChannelConnectionsService,
    records as unknown as ChannelConnectionRepository,
  );
  return { store, records, staleView, fresh };
}

describe('ConnectionAccountStore', () => {
  it('writes only the account, never the rules of the view it was given', async () => {
    const { store, records, staleView, fresh } = setup();
    const account = { channel: ChannelType.Shopify };

    await expect(store.saveAccount(WORKSPACE_ID, staleView, account)).resolves.toBe(fresh);

    expect(records.saveAccountSettings).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, account);
  });

  it('is not found when the connection left the workspace', async () => {
    const { store, records, staleView } = setup();
    records.saveAccountSettings.mockResolvedValue(null);

    await expect(
      store.saveAccount(WORKSPACE_ID, staleView, { channel: ChannelType.Shopify }),
    ).rejects.toThrow(NotFoundException);
  });
});
