/**
 * What an AI call was for. Every metered call names one, so usage can be reported and later
 * priced per feature. Stored as text, so a new feature needs no migration.
 */
export enum AiFeature {
  /** The Content Generator: channel titles and descriptions. */
  ContentGeneration = 'content_generation',
  /** Rewriting a field the merchant is editing, returned as a draft and never stored. */
  ContentDraft = 'content_draft',
  /** Ask Crossmart: grounded answers about Crossmart itself, paid for by the platform. */
  Ask = 'ask',
}
