import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { OrganizationPlanService } from '../../entitlements/services/organization-plan.service.js';
import { BILLING_NOT_ENABLED, NO_BILLING_ACCOUNT } from '../billing.constants.js';
import type { HostedSession } from '../entities/billing-sessions.js';
import { BillingProvider } from '../providers/billing-provider.js';
import {
  type BillingAccountRecord,
  BillingAccountRepository,
} from '../repositories/billing-account.repository.js';
import { isTrialAvailable } from '../rules/billing-account.js';

const NO_TRIAL = 0;

/**
 * An organization's billing account (ADR 0024): its subscription row, its customer at the
 * provider, the trial it may still get, and the billing portal.
 */
@Injectable()
export class BillingAccountService {
  constructor(
    private readonly accounts: BillingAccountRepository,
    private readonly organizationPlans: OrganizationPlanService,
    private readonly provider: BillingProvider,
    private readonly appConfig: AppConfigService,
  ) {}

  /** 404 where billing is off: nothing can be bought on a self-hosted instance. */
  assertEnabled(): void {
    if (!this.appConfig.billingEnabled) throw new NotFoundException(BILLING_NOT_ENABLED);
  }

  /** Reading the plan first gives an organization without a subscription row its default one. */
  async get(organizationId: string): Promise<BillingAccountRecord> {
    await this.organizationPlans.current(organizationId);
    const account = await this.accounts.findByOrganization(organizationId);
    if (!account) throw new NotFoundException(NO_BILLING_ACCOUNT);
    return account;
  }

  /** The organization's customer at the provider, created on its first checkout. */
  async customerOf(account: BillingAccountRecord, email: string): Promise<string> {
    if (account.externalCustomerId) return account.externalCustomerId;
    const customerId = await this.provider.createCustomer({
      organizationId: account.organizationId,
      name: account.organization.name,
      email,
    });
    return this.accounts.saveCustomerId(account.organizationId, customerId);
  }

  /** The trial a checkout starts with: the configured days the first time, none after. */
  trialDaysFor(account: BillingAccountRecord): number {
    return isTrialAvailable(account) ? this.appConfig.billingSettings.trialDays : NO_TRIAL;
  }

  /** 409 until the organization has a customer, which its first checkout creates. */
  async openPortal(organizationId: string): Promise<HostedSession> {
    this.assertEnabled();
    const { externalCustomerId } = await this.get(organizationId);
    if (!externalCustomerId) throw new ConflictException(NO_BILLING_ACCOUNT);
    return this.provider.createPortalSession(externalCustomerId);
  }
}
