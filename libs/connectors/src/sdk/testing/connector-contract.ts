import { ChannelCapability } from '../channel-capability.enum.js';
import type { ChannelConnector } from '../channel-connector.interface.js';
import { isOAuthAppConnector } from '../capabilities/capability-contracts.js';

/** The methods each capability's interface requires, checked at runtime by the contract. */
const CAPABILITY_METHODS: Partial<Record<ChannelCapability, readonly string[]>> = {
  [ChannelCapability.ReceiveWebhooks]: ['verifyWebhook'],
  [ChannelCapability.ImportCatalog]: ['fetchProducts'],
  [ChannelCapability.PublishListings]: ['publish', 'update', 'delist'],
  [ChannelCapability.UpdatePrice]: ['updatePrices'],
  [ChannelCapability.UpdateInventory]: ['setQuantities'],
  [ChannelCapability.FetchOrders]: ['fetchOrders'],
};

const CONTRACT_STATE = 'contract-state';
const CONTRACT_REDIRECT_URI = 'https://api.example.com/callback';
const HTTPS_PROTOCOL = 'https:';
const STATE_PARAM = 'state';

export interface ConnectorContractOptions {
  /** A valid account handle, such as `demo-store.myshopify.com`. */
  validAccountHandle: string;
  invalidAccountHandles: readonly string[];
}

function implementedMethods(connector: ChannelConnector, capability: ChannelCapability): boolean {
  const methods = CAPABILITY_METHODS[capability] ?? [];
  return methods.every((method) => typeof Reflect.get(connector as object, method) === 'function');
}

function checkDescription(connector: ChannelConnector): void {
  expect(connector.displayName.length).toBeGreaterThan(0);
  expect(connector.rateLimits.length).toBeGreaterThan(0);
  for (const bucket of connector.rateLimits) {
    expect(bucket.capacity).toBeGreaterThan(0);
    expect(bucket.restorePerSecond).toBeGreaterThan(0);
  }
}

function checkCapabilities(connector: ChannelConnector): void {
  const missing = [...connector.capabilities].filter(
    (capability) => !implementedMethods(connector, capability),
  );
  expect(missing).toEqual([]);
}

function checkOAuth(connector: ChannelConnector, options: ConnectorContractOptions): void {
  if (!isOAuthAppConnector(connector)) return;
  const accepted = options.invalidAccountHandles.filter(
    (handle) => connector.normalizeAccountHandle(handle) !== null,
  );
  expect(accepted).toEqual([]);
  const accountHandle = connector.normalizeAccountHandle(options.validAccountHandle);
  expect(accountHandle).not.toBeNull();
  const url = connector.authorizationUrl({
    accountHandle: accountHandle ?? '',
    state: CONTRACT_STATE,
    redirectUri: CONTRACT_REDIRECT_URI,
  });
  expect(url.protocol).toBe(HTTPS_PROTOCOL);
  expect(url.searchParams.get(STATE_PARAM)).toBe(CONTRACT_STATE);
}

/**
 * The checks every connector must pass, whatever its channel. Call it from the connector's
 * spec: `describeConnectorContract(() => createConnector(), options)`.
 */
export function describeConnectorContract(
  createConnector: () => ChannelConnector,
  options: ConnectorContractOptions,
): void {
  describe('connector contract', () => {
    it('describes itself and its rate limits', () => checkDescription(createConnector()));
    it('implements every capability it declares', () => checkCapabilities(createConnector()));
    it('rejects settings that do not match its schema', () => {
      expect(() => createConnector().parseSettings({ unexpected: true })).toThrow(Error);
    });
    it('validates account handles and signs the authorization URL with the state', () =>
      checkOAuth(createConnector(), options));
  });
}
