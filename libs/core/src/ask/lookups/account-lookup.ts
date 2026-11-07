import type { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import type { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';

/** The lookups Ask may run, one per kind (`AccountLookup`), injected as a list. */
export const ACCOUNT_LOOKUPS = Symbol('ACCOUNT_LOOKUPS');

/**
 * One read-only lookup of a workspace, as a tool the model can ask for. It reads through the
 * services the API uses, always scoped to the workspace it is given, and never writes.
 */
export abstract class AccountLookup {
  abstract readonly kind: AccountLookupKind;
  /** What the caller must hold in the workspace, the same as the matching API routes. */
  abstract readonly permissions: readonly WorkspacePermission[];

  /** The facts found, as sources the answer can cite; none when nothing matches. */
  abstract run(workspaceId: string, query: string | null): Promise<KnowledgeChunk[]>;
}
