import type { ChannelSession } from '../auth/channel-session.js';
import type { ChannelPage, ExternalProduct } from './catalog.types.js';

/** `ChannelCapability.ImportCatalog`: reads the channel's existing products, page by page. */
export interface CatalogSource {
  fetchProducts(
    session: ChannelSession,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalProduct>>;
}
