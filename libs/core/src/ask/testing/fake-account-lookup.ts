import type { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import type { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { AccountLookup } from '../lookups/account-lookup.js';

/** A lookup that answers fixed facts and records what it was asked, for tests. */
export class FakeAccountLookup extends AccountLookup {
  readonly calls: { workspaceId: string; query: string | null }[] = [];

  constructor(
    readonly kind: AccountLookupKind,
    readonly permissions: readonly WorkspacePermission[],
    private readonly facts: readonly KnowledgeChunk[] = [],
  ) {
    super();
  }

  run(workspaceId: string, query: string | null): Promise<KnowledgeChunk[]> {
    this.calls.push({ workspaceId, query });
    return Promise.resolve([...this.facts]);
  }
}
