import { Injectable } from '@nestjs/common';
import { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { SubscriptionService } from '../../entitlements/services/subscription.service.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { planUsageFacts } from '../rules/account-facts.js';
import { ACCOUNT_PAGES, AccountFactPages } from './account-fact-pages.js';
import { AccountLookup } from './account-lookup.js';

/** The organization's plan, its limits and usage, from `EntitlementService`. */
@Injectable()
export class PlanUsageLookup extends AccountLookup {
  readonly kind = AccountLookupKind.PlanUsage;
  readonly permissions = [WorkspacePermission.ViewBilling];

  constructor(
    private readonly entitlements: EntitlementService,
    private readonly subscriptions: SubscriptionService,
    private readonly pages: AccountFactPages,
  ) {
    super();
  }

  async run(workspaceId: string): Promise<KnowledgeChunk[]> {
    const organizationId = await this.entitlements.organizationIdOf(workspaceId);
    const overview = await this.subscriptions.overview(organizationId);
    return [
      this.pages.chunk({
        id: this.kind,
        title: 'Plan and usage',
        path: ACCOUNT_PAGES.billing,
        text: planUsageFacts(overview),
      }),
    ];
  }
}
