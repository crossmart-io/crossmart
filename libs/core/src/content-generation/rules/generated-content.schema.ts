import { z } from 'zod';
import { RATIONALE_MAX_LENGTH } from '../content-generation.constants.js';
import { ContentField } from '../enums/content-field.enum.js';
import type { ChannelContentRules } from './channel-content-rules.js';

/** The Content Generator's answer: a title and a description, each with why it is better. */
export interface GeneratedContent {
  title: string;
  titleRationale: string;
  descriptionHtml: string;
  descriptionRationale: string;
}

/**
 * The schema the model's answer must match for one channel. It is sent to the model as the
 * output format and checked again on the answer, so a title over the channel's limit is
 * rejected, never stored.
 */
export function generatedContentSchema(rules: ChannelContentRules): z.ZodType<GeneratedContent> {
  const rationale = z.string().min(1).max(RATIONALE_MAX_LENGTH);
  return z.object({
    title: titleField(rules),
    titleRationale: rationale.describe('Why this title works better on the channel'),
    descriptionHtml: descriptionField(rules),
    descriptionRationale: rationale.describe('Why this description works better'),
  });
}

/** A rewrite of the fields asked for; the others are absent. */
export type ContentDraftOutput = Partial<Pick<GeneratedContent, 'title' | 'descriptionHtml'>>;

/** The schema of a rewrite: only the fields asked for, each within the channel's limits. */
export function contentDraftSchema(
  rules: ChannelContentRules,
  fields: ReadonlySet<ContentField>,
): z.ZodType<ContentDraftOutput> {
  if (!fields.has(ContentField.Description)) return z.object({ title: titleField(rules) });
  if (!fields.has(ContentField.Title)) {
    return z.object({ descriptionHtml: descriptionField(rules) });
  }
  return z.object({ title: titleField(rules), descriptionHtml: descriptionField(rules) });
}

function titleField(rules: ChannelContentRules): z.ZodString {
  return z.string().min(1).max(rules.titleMaxLength).describe('The new listing title');
}

function descriptionField(rules: ChannelContentRules): z.ZodString {
  return z
    .string()
    .min(1)
    .max(rules.descriptionMaxLength)
    .describe('The new listing description, as HTML');
}
