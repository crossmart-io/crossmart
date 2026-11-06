import type { AgentClientRegistration } from '../enums/agent-client-registration.enum.js';

/** What a person is shown about an agent before they let it in, and how far to trust it. */
export interface AgentClientProfile {
  clientId: string;
  /** The name to show, from `agentClientName`. Verified only through `verifiedHost`. */
  name: string;
  registration: AgentClientRegistration;
  /** For a metadata document client: the host Crossmart fetched its metadata from. */
  verifiedHost: string | null;
  /** For a self-registered client: the HTTPS host of the site it claims. Nobody checked it. */
  claimedHost: string | null;
}
