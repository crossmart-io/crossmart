/**
 * What a suggestion changes. Stored as text, so a new kind (attributes, categories) needs no
 * migration: add it here, with how it reads and applies in `suggestion-change.ts`.
 */
export enum SuggestionKind {
  /** The title one channel shows (a listing override). */
  ListingTitle = 'listing_title',
  /** The description one channel shows (a listing override), as HTML. */
  ListingDescription = 'listing_description',
}
