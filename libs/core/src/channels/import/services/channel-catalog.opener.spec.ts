import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  ChannelCapability,
  type ChannelConnector,
  type ChannelConnectorRegistry,
  ChannelType,
  fakeChannelSession,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { ChannelConnectionRecord } from '../../repositories/channel-connection.queries.js';
import type { ChannelConnectionRepository } from '../../repositories/channel-connection.repository.js';
import type { ChannelSessionFactory } from '../../services/channel-session.factory.js';
import { ChannelCatalogOpener } from './channel-catalog.opener.js';

function setup(
  connection: Partial<ChannelConnectionRecord> | null,
  capabilities = [ChannelCapability.ImportCatalog],
) {
  const connector = { capabilities: new Set(capabilities), fetchProducts: vi.fn() };
  const connections = { findForWorkspace: vi.fn(() => Promise.resolve(connection)) };
  const sessions = { open: vi.fn(() => Promise.resolve(fakeChannelSession('demo.myshopify.com'))) };
  const registry = { require: vi.fn(() => connector as unknown as ChannelConnector) };
  const opener = new ChannelCatalogOpener(
    connections as unknown as ChannelConnectionRepository,
    sessions as unknown as ChannelSessionFactory,
    registry as unknown as ChannelConnectorRegistry,
  );
  return { opener, connector, sessions };
}

const CONNECTED = { channel: ChannelType.Shopify, status: ChannelConnectionStatus.CONNECTED };

describe('ChannelCatalogOpener', () => {
  it('opens a session and the connector that reads the catalog', async () => {
    const { opener, connector, sessions } = setup(CONNECTED);

    const { source } = await opener.open('ws-1', 'conn-1');

    expect(source).toBe(connector);
    expect(sessions.open).toHaveBeenCalledWith('ws-1', 'conn-1');
  });

  it('accepts only connected connections whose channel imports catalogs', async () => {
    await expect(setup(CONNECTED).opener.requireImportable('ws-1', 'c')).resolves.toBe(CONNECTED);
    await expect(setup(null).opener.requireImportable('ws-1', 'c')).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      setup({
        ...CONNECTED,
        status: ChannelConnectionStatus.NEEDS_REAUTH,
      }).opener.requireImportable('ws-1', 'c'),
    ).rejects.toThrow(ConflictException);
    await expect(setup(CONNECTED, []).opener.requireImportable('ws-1', 'c')).rejects.toThrow(
      BadRequestException,
    );
  });
});
