import { Injectable } from '@nestjs/common';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { WebhookUrlPolicy } from './webhook-url.policy.js';

/** Decides whether an endpoint may be added or moved: its URL, and the plan's endpoint limit. */
@Injectable()
export class WebhookEndpointAdmission {
  constructor(
    private readonly urls: WebhookUrlPolicy,
    private readonly entitlements: EntitlementService,
  ) {}

  /**
   * The new endpoint's URL, normalized. Throws 400 for a URL that may not receive webhooks,
   * then 402 when the organization's plan has no endpoint left (`Feature.WebhookEndpoints`).
   */
  async admit(workspaceId: string, url: string): Promise<string> {
    const allowed = await this.urls.assertAllowed(url);
    await this.entitlements.assertInWorkspace(workspaceId, Feature.WebhookEndpoints);
    return allowed;
  }

  /** A changed URL, normalized; throws 400 when it may not receive webhooks. */
  checkUrl(url: string): Promise<string> {
    return this.urls.assertAllowed(url);
  }
}
