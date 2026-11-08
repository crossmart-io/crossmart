import { HttpException, Injectable } from '@nestjs/common';
import { SubscriptionAccessPolicy } from '../../entitlements/services/subscription-access-policy.js';
import { messageOf } from '../rules/turn-error.js';

/**
 * Whether the workspace may be changed now. An organization whose subscription is not in good
 * standing is read-only (ADR 0024): Agent Worker still reads and answers, but proposes nothing,
 * and tells the person why. The API refuses the writes as well.
 */
@Injectable()
export class AgentWorkerWriteGate {
  constructor(private readonly subscriptionAccess: SubscriptionAccessPolicy) {}

  /** Why changes are refused now, or null when they are allowed. */
  async refusal(workspaceId: string): Promise<string | null> {
    if (!this.subscriptionAccess.enforced) return null;
    try {
      await this.subscriptionAccess.assertWritableInWorkspace(workspaceId);
      return null;
    } catch (error) {
      if (error instanceof HttpException) return messageOf(error);
      throw error;
    }
  }
}
