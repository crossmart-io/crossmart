import { Injectable } from '@nestjs/common';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { EtsyApiClient } from '../api/etsy-api.client.js';
import { type EtsyShopContext, shopParams } from '../api/etsy-shop-context.js';
import {
  ETSY_ME_PATH,
  ETSY_PAGE_SIZE_MAX,
  ETSY_PROCESSING_PROFILES_PATH,
  ETSY_SHIPPING_PROFILES_PATH,
  ETSY_SHOP_PATH,
  EtsyQueryParam,
} from '../etsy.constants.js';
import { EtsyReadinessState } from '../etsy.enums.js';
import { etsyError } from '../etsy-errors.js';
import type { EtsyProfile, EtsyShopProfiles } from '../listing/etsy-listing-setup.js';
import {
  type EtsyProcessingProfile,
  type EtsyShop,
  READINESS_STATE_LABELS,
  etsyMeSchema,
  etsyProcessingProfilesSchema,
  etsyShippingProfilesSchema,
  etsyShopSchema,
} from './etsy-shop.types.js';

const NO_SHOP = 'This Etsy account has no shop. Open an Etsy shop, then connect it.';
const LABEL_SEPARATOR = ' · ';
const DAYS_RANGE_SEPARATOR = '–';
const DAYS_SUFFIX = ' days';

function isReadinessState(value: string): value is EtsyReadinessState {
  return Object.values<string>(EtsyReadinessState).includes(value);
}

/** "Ready to ship · 1–3 days", from what Etsy says about the profile. */
function processingProfileName(profile: EtsyProcessingProfile): string {
  const state = isReadinessState(profile.readiness_state)
    ? READINESS_STATE_LABELS[profile.readiness_state]
    : profile.readiness_state;
  const days =
    profile.processing_days_display_label ??
    `${profile.min_processing_days ?? 0}${DAYS_RANGE_SEPARATOR}${profile.max_processing_days ?? 0}${DAYS_SUFFIX}`;
  return `${state}${LABEL_SEPARATOR}${days}`;
}

/** Reads who signed in, their shop, and the shop's shipping and processing profiles. */
@Injectable()
export class EtsyShopReader {
  constructor(private readonly api: EtsyApiClient) {}

  /** The shop id of the user a token belongs to; refused when they have no shop. */
  async readShopId(accessToken: string): Promise<string> {
    const me = await this.api.get({ path: ETSY_ME_PATH, accessToken }, etsyMeSchema);
    if (!me.shop_id) {
      throw etsyError(ChannelErrorCode.InvalidAccount, NO_SHOP);
    }
    return String(me.shop_id);
  }

  readShop(shop: EtsyShopContext): Promise<EtsyShop> {
    return this.api.get(
      { path: ETSY_SHOP_PATH, params: shopParams(shop), accessToken: shop.accessToken },
      etsyShopSchema,
    );
  }

  async readProfiles(shop: EtsyShopContext): Promise<EtsyShopProfiles> {
    const [shipping, processing] = await Promise.all([
      this.readShippingProfiles(shop),
      this.readProcessingProfiles(shop),
    ]);
    return { shipping, processing };
  }

  private async readShippingProfiles(shop: EtsyShopContext): Promise<EtsyProfile[]> {
    const { results } = await this.api.get(
      {
        path: ETSY_SHIPPING_PROFILES_PATH,
        params: shopParams(shop),
        accessToken: shop.accessToken,
      },
      etsyShippingProfilesSchema,
    );
    return results
      .filter((profile) => !profile.is_deleted)
      .map((profile) => ({
        id: String(profile.shipping_profile_id),
        name: profile.title ?? String(profile.shipping_profile_id),
      }));
  }

  private async readProcessingProfiles(shop: EtsyShopContext): Promise<EtsyProfile[]> {
    const { results } = await this.api.get(
      {
        path: ETSY_PROCESSING_PROFILES_PATH,
        params: shopParams(shop),
        accessToken: shop.accessToken,
        query: { [EtsyQueryParam.Limit]: String(ETSY_PAGE_SIZE_MAX) },
      },
      etsyProcessingProfilesSchema,
    );
    return results.map((profile) => ({
      id: String(profile.readiness_state_id),
      name: processingProfileName(profile),
    }));
  }
}
