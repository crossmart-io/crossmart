import { BadRequestException, Injectable } from '@nestjs/common';
import {
  GOOGLE_COUNTRY_MARKETS,
  type GoogleMerchantSettings,
  GoogleMerchantConnector,
  googleListingSetupSchema,
  isGoogleMerchantSettings,
} from '@crossmart/connectors';
import type { Actor } from '../../../activity/entities/actor.js';
import { ActivityAction } from '../../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../../activity/services/activity-recorder.js';
import type { ChannelConnectionView } from '../../entities/channel-connection-view.js';
import { callChannel } from '../../rules/channel-http-error.js';
import { ChannelSessionFactory } from '../../services/channel-session.factory.js';
import { ConnectionAccountStore } from '../../services/connection-account.store.js';
import type { GoogleListingSetupInput } from '../entities/google-listing-setup-input.js';

const NOT_GOOGLE =
  'This is not a Google Merchant Center connection, or its account has not been read yet';

/**
 * What a Google Merchant Center connection needs before it can list: the country it sells in
 * (its currency and language follow) and the address of each product's page. Saving creates
 * the API data source for the country, once; the same country keeps its data source.
 */
@Injectable()
export class GoogleMerchantSetupService {
  constructor(
    private readonly store: ConnectionAccountStore,
    private readonly sessions: ChannelSessionFactory,
    private readonly google: GoogleMerchantConnector,
    private readonly activity: ActivityRecorder,
  ) {}

  async saveListingSetup(
    workspaceId: string,
    connectionId: string,
    input: GoogleListingSetupInput,
    actor: Actor,
  ): Promise<ChannelConnectionView> {
    const { connection, settings } = await this.load(workspaceId, connectionId);
    const dataSourceId = await this.dataSourceFor(workspaceId, connectionId, settings, input);
    const { currencyCode, contentLanguage } = GOOGLE_COUNTRY_MARKETS[input.country];
    const account: GoogleMerchantSettings = {
      ...settings,
      country: input.country,
      currencyCode,
      contentLanguage,
      listingSetup: googleListingSetupSchema.parse({ ...input, dataSourceId }),
    };
    const saved = await this.store.saveAccount(workspaceId, connection, account);
    await this.record(workspaceId, saved, actor);
    return saved;
  }

  /** The country's data source: the one already made for it, or a new one on Google. */
  private async dataSourceFor(
    workspaceId: string,
    connectionId: string,
    settings: GoogleMerchantSettings,
    input: GoogleListingSetupInput,
  ): Promise<string> {
    const current = settings.listingSetup;
    if (current?.country === input.country) return current.dataSourceId;
    const session = await this.sessions.open(workspaceId, connectionId);
    return callChannel(() => this.google.createDataSource(session, input.country));
  }

  private async load(
    workspaceId: string,
    connectionId: string,
  ): Promise<{ connection: ChannelConnectionView; settings: GoogleMerchantSettings }> {
    const connection = await this.store.get(workspaceId, connectionId);
    const { account } = connection.settings;
    if (!account || !isGoogleMerchantSettings(account)) {
      throw new BadRequestException(NOT_GOOGLE);
    }
    return { connection, settings: account };
  }

  private record(
    workspaceId: string,
    connection: ChannelConnectionView,
    actor: Actor,
  ): Promise<void> {
    return this.activity.record(workspaceId, actor, {
      action: ActivityAction.ChannelListingDefaultsUpdated,
      subject: {
        type: ActivitySubjectType.ChannelConnection,
        id: connection.id,
        label: connection.displayName,
      },
    });
  }
}
