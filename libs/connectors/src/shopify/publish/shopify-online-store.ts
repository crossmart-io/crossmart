import { Injectable, Logger } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { PUBLICATIONS_QUERY, type PublicationsData } from '../graphql/publications.query.js';
import { PUBLISHABLE_PUBLISH_MUTATION } from '../graphql/publishable-publish.mutation.js';
import { ShopifyAdminClient } from '../graphql/shopify-admin.client.js';
import { assertNoUserErrors } from '../graphql/shopify-user-error.js';
import {
  SHOPIFY_ONLINE_STORE_NAME,
  SHOPIFY_PUBLICATION_CACHE_TTL_MS,
  SHOPIFY_PUBLICATIONS_PAGE_SIZE,
  ShopifyScope,
} from '../shopify.constants.js';

interface CachedPublication {
  publicationId: string | null;
  expiresAt: number;
}

type Publication = PublicationsData['publications']['nodes'][number];

function isOnlineStore({ name, catalog }: Publication): boolean {
  const title = catalog?.title ?? name ?? '';
  return title.toLowerCase() === SHOPIFY_ONLINE_STORE_NAME.toLowerCase();
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : typeof error;
}

/**
 * Shows published products to shoppers: `productSet` creates them in the admin only, so each
 * is also published to the store's Online Store sales channel. Stores that did not grant
 * `write_publications` are skipped, and a failure never fails the publish, since the product
 * exists on Shopify by then; the next update tries again.
 */
@Injectable()
export class ShopifyOnlineStore {
  private readonly logger = new Logger(ShopifyOnlineStore.name);
  private readonly cache = new Map<string, CachedPublication>();

  constructor(private readonly admin: ShopifyAdminClient) {}

  /** Whether the product is on the Online Store now. */
  async show(session: ChannelSession, productId: string): Promise<boolean> {
    if (!session.grantedScopes.includes(ShopifyScope.WritePublications)) return false;
    try {
      const publicationId = await this.publicationId(session);
      if (!publicationId) return false;
      const { publishablePublish } = await this.admin.request(
        session,
        PUBLISHABLE_PUBLISH_MUTATION,
        { id: productId, input: [{ publicationId }] },
      );
      assertNoUserErrors(publishablePublish.userErrors);
      return true;
    } catch (error) {
      this.logger.warn(`Could not show ${productId} in the Online Store: ${describe(error)}`);
      return false;
    }
  }

  /** The store's Online Store publication, read once and cached per connection for a while. */
  private async publicationId(session: ChannelSession): Promise<string | null> {
    const cached = this.cache.get(session.connectionId);
    if (cached && cached.expiresAt > Date.now()) return cached.publicationId;
    const { publications } = await this.admin.request(session, PUBLICATIONS_QUERY, {
      first: SHOPIFY_PUBLICATIONS_PAGE_SIZE,
    });
    const publicationId = publications.nodes.find(isOnlineStore)?.id ?? null;
    this.cache.set(session.connectionId, {
      publicationId,
      expiresAt: Date.now() + SHOPIFY_PUBLICATION_CACHE_TTL_MS,
    });
    return publicationId;
  }
}
