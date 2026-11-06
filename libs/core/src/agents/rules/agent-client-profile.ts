import { CIMD_CLIENT_DISCOVERY_ID } from '../agents.constants.js';
import type { AgentClientProfile } from '../entities/agent-client-profile.js';
import { AgentClientRegistration } from '../enums/agent-client-registration.enum.js';
import { agentClientName } from './agent-client-name.js';

const HTTPS_PROTOCOL = 'https:';

/** The stored client fields a profile is built from. */
export interface AgentClientDetails {
  clientId: string;
  name: string | null;
  uri: string | null;
  clientDiscoveryId: string | null;
}

/** The host of an HTTPS address; null for anything else. */
function httpsHostOf(address: string | null): string | null {
  if (!address) return null;
  try {
    const url = new URL(address);
    return url.protocol === HTTPS_PROTOCOL ? url.host : null;
  } catch {
    return null;
  }
}

/**
 * How far an agent can be trusted. A metadata document client's id is the HTTPS address
 * Crossmart fetched its metadata from, so its host is verified (and its `client_uri` must share
 * it). A self-registered client only claims its name and `client_uri`.
 */
export function toAgentClientProfile(client: AgentClientDetails): AgentClientProfile {
  const verifiedHost =
    client.clientDiscoveryId === CIMD_CLIENT_DISCOVERY_ID ? httpsHostOf(client.clientId) : null;
  return {
    clientId: client.clientId,
    name: agentClientName(client.clientId, client.name),
    registration: verifiedHost
      ? AgentClientRegistration.MetadataDocument
      : AgentClientRegistration.Dynamic,
    verifiedHost,
    claimedHost: verifiedHost ? null : httpsHostOf(client.uri),
  };
}
