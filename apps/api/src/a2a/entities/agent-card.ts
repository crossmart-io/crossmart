/** The Agent Card (A2A 1.0 §4.4.1), as served at `/.well-known/agent-card.json`. */
export interface AgentInterface {
  url: string;
  protocolBinding: string;
  protocolVersion: string;
}

export interface AgentProvider {
  organization: string;
  url: string;
}

export interface AgentCapabilities {
  streaming: boolean;
  pushNotifications: boolean;
  extendedAgentCard: boolean;
}

/** Which schemes (and scopes) a request may use: `{ schemes: { name: { list: [...] } } }`. */
export interface SecurityRequirement {
  schemes: Record<string, { list: string[] }>;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
  securityRequirements?: SecurityRequirement[];
}

export interface AgentCard {
  name: string;
  description: string;
  supportedInterfaces: AgentInterface[];
  provider: AgentProvider;
  version: string;
  documentationUrl: string;
  capabilities: AgentCapabilities;
  securitySchemes: Record<string, unknown>;
  securityRequirements: SecurityRequirement[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
}
