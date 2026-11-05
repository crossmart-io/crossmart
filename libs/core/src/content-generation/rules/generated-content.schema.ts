import { z } from 'zod';
import { RATIONALE_MAX_LENGTH } from '../content-generation.constants.js';
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
    title: z.string().min(1).max(rules.titleMaxLength).describe('The new listing title'),
    titleRationale: rationale.describe('Why this title works better on the channel'),
    descriptionHtml: z
      .string()
      .min(1)
      .max(rules.descriptionMaxLength)
      .describe('The new listing description, as HTML'),
    descriptionRationale: rationale.describe('Why this description works better'),
  });
}
