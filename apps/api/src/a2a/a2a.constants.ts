/**
 * The Agent2Agent (A2A) protocol, version 1.0 (a2a-protocol.org, Linux Foundation), as Crossmart
 * serves it (ADR 0025): an Agent Card and a JSON-RPC endpoint answered by Ask Crossmart.
 */

/** The protocol version served, as `Major.Minor` (patch versions never matter). */
export const A2A_PROTOCOL_VERSION = '1.0';
/** What an empty `A2A-Version` means, per the specification. */
export const A2A_DEFAULT_CLIENT_VERSION = '0.3';
export const A2A_VERSION_HEADER = 'a2a-version';
/** Clients may send the version as a query parameter instead of the header. */
export const A2A_VERSION_QUERY = 'A2A-Version';
export const A2A_PROTOCOL_BINDING_JSONRPC = 'JSONRPC';
export const JSON_RPC_VERSION = '2.0';

/** The JSON-RPC endpoint, outside `/api/v1` as A2A clients expect: `POST /a2a`. */
export const A2A_ROUTE = 'a2a';
/** The well-known URI of the Agent Card (A2A §8.2, registered with IANA). */
export const AGENT_CARD_ROUTE = '.well-known/agent-card.json';
/** How long clients may cache the Agent Card. */
export const AGENT_CARD_MAX_AGE_SECONDS = 60 * 60;

export const A2A_JSON_MEDIA_TYPE = 'application/json';
export const A2A_TEXT_MEDIA_TYPE = 'text/plain';

/** The Agent Card's identity. */
export const AGENT_NAME = 'Crossmart';
export const AGENT_DESCRIPTION =
  'Answers questions about Crossmart, the open-source multichannel platform for sellers and ' +
  'their AI agents: what it does, its plans and limits, and how to use its dashboard, API, ' +
  'SDKs and MCP server, from its public docs with citations. Authenticated agents can also ask ' +
  'about their own workspace (listings, plan and usage, stores), read-only, and any caller ' +
  'can hand the conversation to a person.';
export const AGENT_PROVIDER_ORGANIZATION = 'YIOT LLC (crossmart.io)';
export const AGENT_PROVIDER_URL = 'https://crossmart.io';
export const AGENT_DOCUMENTATION_URL = 'https://docs.crossmart.io/developers/';

/** Security scheme names in the Agent Card. */
export const SECURITY_SCHEME_BEARER = 'crossmartAgentToken';
export const SECURITY_SCHEME_API_KEY = 'crossmartApiKey';
export const API_KEY_LOCATION_HEADER = 'header';

/** The Agent Card's skills. */
export enum A2aSkillId {
  AskAboutCrossmart = 'ask_about_crossmart',
  AccountHelp = 'account_help',
  EscalateToHuman = 'escalate_to_human',
}

/** A data part with this action escalates the conversation (`contextId`) to a person. */
export const A2A_ESCALATE_ACTION = 'escalate';
export const A2A_ANSWER_ARTIFACT_NAME = 'answer';
export const A2A_REPLY_ARTIFACT_NAME = 'reply';

/** `ListTasks` page sizes. */
export const A2A_DEFAULT_PAGE_SIZE = 50;
export const A2A_MAX_PAGE_SIZE = 100;
/** `nextPageToken` on the last page, as the specification requires. */
export const A2A_LAST_PAGE_TOKEN = '';

/** What error details are typed as (ProtoJSON `Any`). */
export const ERROR_INFO_TYPE = 'type.googleapis.com/google.rpc.ErrorInfo';
export const ERROR_DOMAIN = 'crossmart.io';

/** What the agent says on a task's status when a person can follow up. */
export const A2A_ESCALATION_OFFER_TEXT =
  'A person from the Crossmart team can follow up. Send a message in this context with a data ' +
  'part {"action": "escalate", "contactEmail": "...", "callbackUrl": "..."} to reach them.';
export const A2A_ESCALATION_OPENED_TEXT =
  'A person from the Crossmart team will reply. Call GetTask with this task id to read the reply.';
export const A2A_ESCALATION_REPLIED_TEXT = 'The Crossmart team replied.';

/** The version of Crossmart's agent (its skills and behaviour), in the Agent Card. */
export const AGENT_CARD_VERSION = '1.0.0';
/** Separates the parts of a version: `1.0`. */
export const VERSION_SEPARATOR = '.';
export const MAJOR_MINOR_PARTS = 2;
