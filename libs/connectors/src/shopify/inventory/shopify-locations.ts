import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { PRIMARY_LOCATION_QUERY } from '../graphql/primary-location.query.js';
import { ShopifyAdminClient } from '../graphql/shopify-admin.client.js';
import { SHOPIFY_LOCATION_CACHE_TTL_MS } from '../shopify.constants.js';

interface CachedLocation {
  locationId: string | null;
  expiresAt: number;
}

/**
 * The primary location of each connected store, where Crossmart sets stock. Read once and
 * cached per connection for a few minutes, so a sync of many batches costs one query.
 */
@Injectable()
export class ShopifyLocations {
  private readonly cache = new Map<string, CachedLocation>();

  constructor(private readonly admin: ShopifyAdminClient) {}

  async primaryLocationId(session: ChannelSession): Promise<string | null> {
    const cached = this.cache.get(session.connectionId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.locationId;
    }
    const { location } = await this.admin.request(session, PRIMARY_LOCATION_QUERY);
    const locationId = location?.id ?? null;
    this.cache.set(session.connectionId, {
      locationId,
      expiresAt: Date.now() + SHOPIFY_LOCATION_CACHE_TTL_MS,
    });
    return locationId;
  }
}
