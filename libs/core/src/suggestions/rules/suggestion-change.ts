import { findEnumValue } from '@crossmart/common';
import type { ListingContent } from '../../listings/entities/listing-override.js';
import { SuggestionKind } from '../enums/suggestion-kind.enum.js';

/** The listing content field each kind changes; one entry per kind, so a new kind must add it. */
export const SUGGESTION_KIND_FIELDS: Record<SuggestionKind, keyof ListingContent> = {
  [SuggestionKind.ListingTitle]: 'title',
  [SuggestionKind.ListingDescription]: 'descriptionHtml',
};

/** How each kind reads in the activity log: "the title", "the description". */
export const SUGGESTION_KIND_LABELS: Record<SuggestionKind, string> = {
  [SuggestionKind.ListingTitle]: 'title',
  [SuggestionKind.ListingDescription]: 'description',
};

/** The value a kind would replace, as the listing shows it now. */
export function currentValueOf(kind: SuggestionKind, content: ListingContent): string {
  return content[SUGGESTION_KIND_FIELDS[kind]];
}

/** What a suggestion changes and where, for the activity log: "title on Demo Store". */
export function describeSuggestion(record: {
  kind: string;
  connection: { displayName: string } | null;
}): string {
  const kind = findEnumValue(SuggestionKind, record.kind);
  const field = kind ? SUGGESTION_KIND_LABELS[kind] : record.kind;
  return record.connection ? `${field} on ${record.connection.displayName}` : field;
}
