import type { ChannelAuthStrategy } from './channel-auth-strategy.enum.js';
import type { ChannelCapability } from './channel-capability.enum.js';
import type { ChannelType } from './channel-type.enum.js';

/**
 * Base contract every marketplace connector implements.
 * Capability-specific behaviour (publishing, inventory, orders...) is added through
 * dedicated interfaces as each capability is built, so a connector only implements
 * what its channel supports.
 */
export interface ChannelConnector {
  readonly channel: ChannelType;
  readonly displayName: string;
  readonly authStrategy: ChannelAuthStrategy;
  readonly capabilities: ReadonlySet<ChannelCapability>;
}

export function supportsCapability(
  connector: ChannelConnector,
  capability: ChannelCapability,
): boolean {
  return connector.capabilities.has(capability);
}
