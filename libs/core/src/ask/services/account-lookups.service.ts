import { Inject, Injectable } from '@nestjs/common';
import type { AccountLookupRequest } from '../entities/account-lookup.js';
import type { AskWorkspaceAccess } from '../entities/ask-caller.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import type { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { ACCOUNT_LOOKUPS, AccountLookup } from '../lookups/account-lookup.js';

/**
 * The read-only lookups Ask runs on the caller's own workspace (ADR 0025). Every lookup is
 * scoped to the caller's workspace and needs the permissions the matching API routes need; one
 * the caller may not run is never offered to the model, and skipped if it asks anyway.
 */
@Injectable()
export class AccountLookupsService {
  private readonly byKind: ReadonlyMap<AccountLookupKind, AccountLookup>;

  constructor(@Inject(ACCOUNT_LOOKUPS) lookups: readonly AccountLookup[]) {
    this.byKind = new Map(lookups.map((lookup) => [lookup.kind, lookup]));
  }

  /** The lookups the caller may run in their workspace. */
  allowed(access: AskWorkspaceAccess): AccountLookupKind[] {
    return [...this.byKind.values()]
      .filter((lookup) =>
        lookup.permissions.every((permission) => access.permissions.has(permission)),
      )
      .map((lookup) => lookup.kind);
  }

  /** The facts each allowed lookup found, as sources the answer can cite. */
  async run(
    access: AskWorkspaceAccess,
    requests: readonly AccountLookupRequest[],
  ): Promise<KnowledgeChunk[]> {
    const allowed = new Set(this.allowed(access));
    const lookups = requests.flatMap((request) => {
      const lookup = allowed.has(request.kind) ? this.byKind.get(request.kind) : undefined;
      return lookup ? [lookup.run(access.workspaceId, request.query)] : [];
    });
    const found = await Promise.all(lookups);
    return found.flat();
  }
}
