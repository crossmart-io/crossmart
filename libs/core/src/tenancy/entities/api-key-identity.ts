import type { CustomRoleRef, ResolvedRole, RoleAssignment } from './role-assignment.js';

/** Who is calling when a request carries an API key, with what its role allows. */
export interface ApiKeyIdentity extends ResolvedRole {
  apiKeyId: string;
  workspaceId: string;
  createdById: string;
}

export interface NewApiKey extends RoleAssignment {
  name: string;
  expiresAt?: Date;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  role: ResolvedRole['role'];
  customRole: CustomRoleRef | null;
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
