import { BadRequestException, Injectable } from '@nestjs/common';
import {
  type EbayBusinessPolicies,
  EbayConnector,
  type EbayDefaultPolicyIds,
  type EbayListingDefaults,
  type EbayPolicy,
  type EbaySettings,
  type EbayShipFrom,
  ebayListingDefaultsSchema,
  isEbaySettings,
} from '@crossmart/connectors';
import type { Actor } from '../../../activity/entities/actor.js';
import { ActivityAction } from '../../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../../activity/services/activity-recorder.js';
import type { ChannelConnectionView } from '../../entities/channel-connection-view.js';
import { callChannel } from '../../rules/channel-http-error.js';
import { ChannelSessionFactory } from '../../services/channel-session.factory.js';
import { ConnectionAccountStore } from '../../services/connection-account.store.js';
import type { EbayListingDefaultsInput } from '../entities/ebay-listing-defaults-input.js';

const NOT_EBAY = 'This is not an eBay connection, or its account has not been read yet';
const UNKNOWN_POLICY = 'Choose one of the account’s own business policies';

/** The policy lists of the account, by the defaults field that picks from each. */
const POLICY_FIELDS = [
  ['fulfillmentPolicyId', 'fulfillment'],
  ['paymentPolicyId', 'payment'],
  ['returnPolicyId', 'return'],
] as const satisfies readonly [keyof EbayListingDefaultsInput, keyof EbayBusinessPolicies][];

/**
 * What an eBay connection needs before it can list: the merchant's listing defaults (policies,
 * condition and ship-from location), business policies opted in to or created with sensible
 * defaults, and policies read again after the merchant edits them on eBay. Every change keeps the merchant's other choices.
 */
@Injectable()
export class EbayAccountSetupService {
  constructor(
    private readonly store: ConnectionAccountStore,
    private readonly sessions: ChannelSessionFactory,
    private readonly ebay: EbayConnector,
    private readonly activity: ActivityRecorder,
  ) {}

  /** Saves the defaults, creating or updating the ship-from location on eBay first. */
  async saveListingDefaults(
    workspaceId: string,
    connectionId: string,
    input: EbayListingDefaultsInput,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    const { connection, settings } = await this.load(workspaceId, connectionId);
    this.assertOwnPolicies(input, settings.policies);
    const merchantLocationKey = input.location
      ? await this.saveLocation(workspaceId, connectionId, input.location)
      : null;
    const listingDefaults = ebayListingDefaultsSchema.parse({ ...input, merchantLocationKey });
    const account: EbaySettings = { ...settings, listingDefaults };
    const saved = await this.store.saveAccount(workspaceId, connection, account);
    await this.record(workspaceId, saved, actor, ActivityAction.ChannelListingDefaultsUpdated);
    return saved;
  }

  /** Opts the seller in to business policies, then reads the policies again. */
  async optInToBusinessPolicies(
    workspaceId: string,
    connectionId: string,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    await this.load(workspaceId, connectionId);
    const session = await this.sessions.open(workspaceId, connectionId);
    await callChannel(() => this.ebay.optInToBusinessPolicies(session));
    const saved = await this.refreshPolicies(workspaceId, connectionId);
    await this.record(workspaceId, saved, actor, ActivityAction.ChannelPoliciesOptedIn);
    return saved;
  }

  /**
   * Creates default shipping, payment and return policies on the eBay account (opting it in
   * first when needed), reads the policies again, and chooses the new ones as the defaults.
   */
  async createDefaultPolicies(
    workspaceId: string,
    connectionId: string,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    const { connection, settings } = await this.load(workspaceId, connectionId);
    const session = await this.sessions.open(workspaceId, connectionId);
    const created = await callChannel(() =>
      this.ebay.createDefaultBusinessPolicies(session, {
        currencyCode: settings.currencyCode,
        businessPoliciesEnabled: settings.businessPoliciesEnabled,
      }),
    );
    const profile = await callChannel(() => this.ebay.describeAccount(session));
    const account: EbaySettings = {
      ...profile.settings,
      listingDefaults: this.choosePolicies(settings.listingDefaults, created),
    };
    const saved = await this.store.saveAccount(workspaceId, connection, account);
    await this.record(workspaceId, saved, actor, ActivityAction.ChannelDefaultPoliciesCreated);
    return saved;
  }

  /** Reads the account and its policies again; the listing defaults are kept. */
  async refreshPolicies(workspaceId: string, connectionId: string): Promise<ChannelConnectionView> {
    const { connection, settings } = await this.load(workspaceId, connectionId);
    const session = await this.sessions.open(workspaceId, connectionId);
    const profile = await callChannel(() => this.ebay.describeAccount(session));
    const account: EbaySettings = {
      ...profile.settings,
      listingDefaults: settings.listingDefaults,
    };
    return this.store.saveAccount(workspaceId, connection, account);
  }

  private async load(
    workspaceId: string,
    connectionId: string,
  ): Promise<{ connection: ChannelConnectionView; settings: EbaySettings }> {
    const connection = await this.store.get(workspaceId, connectionId);
    const { account } = connection.settings;
    if (!account || !isEbaySettings(account)) {
      throw new BadRequestException(NOT_EBAY);
    }
    return { connection, settings: account };
  }

  private async saveLocation(
    workspaceId: string,
    connectionId: string,
    location: EbayShipFrom,
  ): Promise<string> {
    const session = await this.sessions.open(workspaceId, connectionId);
    return callChannel(() => this.ebay.saveShipFromLocation(session, location));
  }

  /** The merchant's defaults with the created policies chosen; the rest is kept. */
  private choosePolicies(
    defaults: EbayListingDefaults | undefined,
    created: EbayDefaultPolicyIds,
  ): EbayListingDefaults {
    return ebayListingDefaultsSchema.parse({
      ...defaults,
      fulfillmentPolicyId: created.fulfillment,
      paymentPolicyId: created.payment,
      returnPolicyId: created.return,
    });
  }

  private assertOwnPolicies(input: EbayListingDefaultsInput, policies: EbayBusinessPolicies): void {
    const isOwn = (policyId: string | null, list: readonly EbayPolicy[]): boolean =>
      policyId === null || list.some((policy) => policy.id === policyId);
    if (!POLICY_FIELDS.every(([field, type]) => isOwn(input[field], policies[type]))) {
      throw new BadRequestException(UNKNOWN_POLICY);
    }
  }

  private record(
    workspaceId: string,
    connection: ChannelConnectionView,
    actor: Actor,
    action: ActivityAction,
  ): Promise<void> {
    return this.activity.record(workspaceId, actor, {
      action,
      subject: {
        type: ActivitySubjectType.ChannelConnection,
        id: connection.id,
        label: connection.displayName,
      },
    });
  }
}
