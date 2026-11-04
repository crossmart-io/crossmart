import type { WorkspaceRole } from '@crossmart/database';

/** Who is calling when a request carries an API key. */
export interface ApiKeyIdentity {
  apiKeyId: string;
  workspaceId: string;
  role: WorkspaceRole;
  createdById: string;
}

export interface NewApiKey {
  name: string;
  role: WorkspaceRole;
  expiresAt?: Date;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  role: WorkspaceRole;
  prefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

/** Returned once, at creation. The secret is never stored or shown again. */
export interface IssuedApiKey {
  apiKey: ApiKeySummary;
  secret: string;
}
