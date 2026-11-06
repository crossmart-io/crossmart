import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EtsyConnector,
  type EtsyProfile,
  type EtsySettings,
  etsyListingSetupSchema,
  isEtsySettings,
} from '@crossmart/connectors';
import type { Actor } from '../../../activity/entities/actor.js';
import { ActivityAction } from '../../../activity/enums/activity-action.enum.js';
import { ActivityRecorder } from '../../../activity/services/activity-recorder.js';
import type { ChannelConnectionView } from '../../entities/channel-connection-view.js';
import { callChannel } from '../../rules/channel-http-error.js';
import {
  type ConnectionAccount,
  type ConnectionAccountKind,
  loadConnectionAccount,
  recordConnectionChange,
} from '../../rules/connection-account.js';
import { ChannelSessionFactory } from '../../services/channel-session.factory.js';
import { ConnectionAccountStore } from '../../services/connection-account.store.js';
import type { EtsyListingSetupInput } from '../entities/etsy-listing-setup-input.js';

const ETSY_ACCOUNT: ConnectionAccountKind<EtsySettings> = {
  isAccount: isEtsySettings,
  notThisChannel: 'This is not an Etsy connection, or its shop has not been read yet',
};
const UNKNOWN_PROFILE = 'Choose one of the shop’s own shipping and processing profiles';

function isOwn(profileId: string | null, profiles: readonly EtsyProfile[]): boolean {
  return profileId === null || profiles.some((profile) => profile.id === profileId);
}

/**
 * What an Etsy connection needs before it can list: the merchant's listing setup (who made the
 * items, when, whether they are supplies, and the shipping and processing profiles), and the
 * shop's profiles read again after the merchant edits them on Etsy. Each change keeps the
 * merchant's other choices.
 */
@Injectable()
export class EtsyShopSetupService {
  constructor(
    private readonly store: ConnectionAccountStore,
    private readonly sessions: ChannelSessionFactory,
    private readonly etsy: EtsyConnector,
    private readonly activity: ActivityRecorder,
  ) {}

  async saveListingSetup(
    workspaceId: string,
    connectionId: string,
    input: EtsyListingSetupInput,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    const { connection, settings } = await this.load(workspaceId, connectionId);
    const { shipping, processing } = settings.profiles;
    if (
      !isOwn(input.shippingProfileId, shipping) ||
      !isOwn(input.processingProfileId, processing)
    ) {
      throw new BadRequestException(UNKNOWN_PROFILE);
    }
    const account: EtsySettings = {
      ...settings,
      listingSetup: etsyListingSetupSchema.parse(input),
    };
    const saved = await this.store.saveAccount(workspaceId, connection, account);
    await recordConnectionChange(this.activity, workspaceId, actor, {
      action: ActivityAction.ChannelListingDefaultsUpdated,
      connection: saved,
    });
    return saved;
  }

  /** Reads the shop and its profiles again; the listing setup is kept. */
  async refreshShop(workspaceId: string, connectionId: string): Promise<ChannelConnectionView> {
    const { connection, settings } = await this.load(workspaceId, connectionId);
    const session = await this.sessions.open(workspaceId, connectionId);
    const profile = await callChannel(() => this.etsy.describeAccount(session));
    const account: EtsySettings = { ...profile.settings, listingSetup: settings.listingSetup };
    return this.store.saveAccount(workspaceId, connection, account);
  }

  private load(
    workspaceId: string,
    connectionId: string,
  ): Promise<ConnectionAccount<EtsySettings>> {
    return loadConnectionAccount(this.store, workspaceId, connectionId, ETSY_ACCOUNT);
  }
}
