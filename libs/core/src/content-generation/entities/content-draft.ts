import type { ListingContent } from '../../listings/entities/listing-override.js';
import type { ContentField } from '../enums/content-field.enum.js';

/** A request to rewrite fields a merchant is editing, for the catalog or for one store. */
export interface ContentDraftRequest {
  workspaceId: string;
  productId: string;
  /** The store the text is for; null for the catalog's own content. */
  connectionId: string | null;
  fields: readonly ContentField[];
  instruction: string | null;
  /** The fields as edited and not yet saved; what is saved stands in for any left out. */
  current: Partial<ListingContent>;
}

/** The rewritten fields, to put in the form. Nothing is stored. Null where not asked for. */
export interface ContentDraft {
  title: string | null;
  descriptionHtml: string | null;
}
