import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { EtsyPathParam } from '../etsy.constants.js';
import { etsyError } from '../etsy-errors.js';
import { isEtsyShopId } from '../etsy-shop-id.js';

const NOT_AN_ETSY_SHOP = 'This is not an Etsy shop';

/** Who a call acts for: the shop's token and id. */
export interface EtsyShopContext {
  accessToken: string;
  shopId: string;
}

/** The token and shop of a session on an Etsy connection, whose account id is the shop id. */
export async function etsyShopContext(session: ChannelSession): Promise<EtsyShopContext> {
  if (!isEtsyShopId(session.externalAccountId)) {
    throw etsyError(ChannelErrorCode.InvalidAccount, NOT_AN_ETSY_SHOP);
  }
  return { accessToken: await session.accessToken(), shopId: session.externalAccountId };
}

/** The `{shop_id}` path parameter of a shop. */
export function shopParams(shop: EtsyShopContext): Partial<Record<EtsyPathParam, string>> {
  return { [EtsyPathParam.ShopId]: shop.shopId };
}
