import { Injectable } from '@nestjs/common';
import { API_KEY_HEADER, AppConfigService } from '@crossmart/common';
import { AgentScope } from '@crossmart/core';
import { AUTH_BASE_PATH } from '../../auth/auth.constants.js';
import {
  A2A_JSON_MEDIA_TYPE,
  A2A_PROTOCOL_BINDING_JSONRPC,
  A2A_PROTOCOL_VERSION,
  A2A_ROUTE,
  A2A_TEXT_MEDIA_TYPE,
  A2aSkillId,
  AGENT_DESCRIPTION,
  AGENT_DOCUMENTATION_URL,
  AGENT_NAME,
  AGENT_PROVIDER_ORGANIZATION,
  AGENT_PROVIDER_URL,
  API_KEY_LOCATION_HEADER,
  SECURITY_SCHEME_API_KEY,
  SECURITY_SCHEME_BEARER,
} from '../a2a.constants.js';
import type { AgentCard, AgentSkill, SecurityRequirement } from '../entities/agent-card.js';

const PATH_SEPARATOR = '/';
const MODES = [A2A_TEXT_MEDIA_TYPE, A2A_JSON_MEDIA_TYPE];
const NO_SCOPES: string[] = [];

/** The account skill needs a key, or an agent token with `catalog:read`. */
const ACCOUNT_SECURITY: SecurityRequirement[] = [
  { schemes: { [SECURITY_SCHEME_BEARER]: { list: [AgentScope.CatalogRead] } } },
  { schemes: { [SECURITY_SCHEME_API_KEY]: { list: NO_SCOPES } } },
];

const SKILLS: AgentSkill[] = [
  {
    id: A2aSkillId.AskAboutCrossmart,
    name: 'Ask about Crossmart',
    description:
      'Answers questions about Crossmart (channels, plans and limits, the API, SDKs, MCP ' +
      'server and dashboard) from its public docs, citing the pages. Anonymous; continue a ' +
      'conversation by sending the returned contextId.',
    tags: ['crossmart', 'ecommerce', 'multichannel', 'documentation', 'support'],
    examples: [
      'Which marketplaces does Crossmart support?',
      'How do I publish one product to Shopify and eBay?',
      'What are the API rate limits?',
    ],
    inputModes: [A2A_TEXT_MEDIA_TYPE],
    outputModes: MODES,
  },
  {
    id: A2aSkillId.AccountHelp,
    name: 'Account help',
    description:
      'For an authenticated agent (an OAuth access token or a Crossmart API key): answers ' +
      'about its own workspace, read-only and within its permissions: why a listing failed, ' +
      'which stores are connected, the plan and its usage.',
    tags: ['crossmart', 'account', 'listings', 'support'],
    examples: [
      'Why did my listing for SKU MUG-1 fail on eBay?',
      'Which of my stores need reconnecting?',
    ],
    inputModes: [A2A_TEXT_MEDIA_TYPE],
    outputModes: MODES,
    securityRequirements: ACCOUNT_SECURITY,
  },
  {
    id: A2aSkillId.EscalateToHuman,
    name: 'Escalate to a person',
    description:
      'Hands the conversation (contextId) to the Crossmart team. Send a message in the context ' +
      'with a data part {"action": "escalate", "contactEmail": "...", "callbackUrl": "..."} ' +
      '(both optional). The returned task stays working until the team replies; poll it ' +
      'with GetTask. A few escalations a day per caller.',
    tags: ['crossmart', 'support', 'human'],
    examples: ['{"action": "escalate", "contactEmail": "owner@example.com"}'],
    inputModes: [A2A_JSON_MEDIA_TYPE],
    outputModes: [A2A_TEXT_MEDIA_TYPE],
  },
];

/** Crossmart's Agent Card (A2A 1.0 §4.4.1), built from this instance's public URLs. */
@Injectable()
export class AgentCardFactory {
  constructor(private readonly config: AppConfigService) {}

  card(version: string): AgentCard {
    return {
      name: AGENT_NAME,
      description: AGENT_DESCRIPTION,
      supportedInterfaces: [
        {
          url: [this.config.apiPublicUrl, A2A_ROUTE].join(PATH_SEPARATOR),
          protocolBinding: A2A_PROTOCOL_BINDING_JSONRPC,
          protocolVersion: A2A_PROTOCOL_VERSION,
        },
      ],
      provider: { organization: AGENT_PROVIDER_ORGANIZATION, url: AGENT_PROVIDER_URL },
      version,
      documentationUrl: AGENT_DOCUMENTATION_URL,
      capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: false },
      securitySchemes: this.securitySchemes(),
      // Empty: anonymous calls are allowed; the account skill states its own requirements.
      securityRequirements: [],
      defaultInputModes: MODES,
      defaultOutputModes: MODES,
      skills: SKILLS,
    };
  }

  private securitySchemes(): Record<string, unknown> {
    const authBase = `${this.config.authBaseUrl}${AUTH_BASE_PATH}`;
    return {
      [SECURITY_SCHEME_BEARER]: {
        oauth2SecurityScheme: {
          description:
            'An agent access token from Crossmart’s OAuth server (the same one the MCP ' +
            'server uses; see docs.crossmart.io/developers/agents/).',
          oauth2MetadataUrl: `${this.config.authBaseUrl}/.well-known/oauth-authorization-server${AUTH_BASE_PATH}`,
          flows: {
            authorizationCode: {
              authorizationUrl: `${authBase}/oauth2/authorize`,
              tokenUrl: `${authBase}/oauth2/token`,
              scopes: { [AgentScope.CatalogRead]: 'Read products, stock, stores and listings' },
              pkceRequired: true,
            },
          },
        },
      },
      [SECURITY_SCHEME_API_KEY]: {
        apiKeySecurityScheme: {
          description: 'A Crossmart workspace API key.',
          location: API_KEY_LOCATION_HEADER,
          name: API_KEY_HEADER,
        },
      },
    };
  }
}
