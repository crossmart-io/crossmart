import { z } from 'zod';
import {
  ASK_ANSWER_MAX_LENGTH,
  ASK_LOOKUP_QUERY_MAX_LENGTH,
  ASK_MAX_ACCOUNT_LOOKUPS,
  ASK_MAX_CITATIONS,
} from '../ask.constants.js';
import { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';

/** The part of the model's answer that becomes the reply: never URLs, only source ids. */
export interface AskGroundableOutput {
  outcome: AskOutcome;
  answer: string;
  sourceIds: string[];
  confidence: AskConfidence;
}

/** What the model returns. */
export interface AskModelOutput extends AskGroundableOutput {
  asksForPerson: boolean;
  salesInquiry: boolean;
}

/** A lookup as the model asks for it. */
export interface AskModelLookup {
  kind: AccountLookupKind;
  /** A SKU or title for `listing_status`; empty otherwise. */
  query: string;
}

/** What the model returns when it may ask for account lookups first. */
export interface AskLookupModelOutput extends AskModelOutput {
  lookups: AskModelLookup[];
}

const askModelOutputShape = {
  outcome: z
    .enum(AskOutcome)
    .describe(
      'answered: the sources answer it; unknown: they do not; out_of_scope: not about Crossmart',
    ),
  answer: z.string().min(1).max(ASK_ANSWER_MAX_LENGTH).describe('The answer, in plain text'),
  sourceIds: z
    .array(z.string())
    .max(ASK_MAX_CITATIONS)
    .describe('Ids of the sources the answer uses, such as S1 or A1'),
  confidence: z.enum(AskConfidence).describe('How directly the sources answer the question'),
  asksForPerson: z.boolean().describe('The caller asks to talk to a person'),
  salesInquiry: z.boolean().describe('A sales question: Enterprise, custom terms, a demo'),
};

/** The model's answer must match this, or it is rejected. Sent as the output format too. */
export const askModelOutputSchema: z.ZodType<AskModelOutput> = z.object(askModelOutputShape);

/** The first pass for a workspace caller: the answer, or the lookups it needs first. */
export const askLookupModelOutputSchema: z.ZodType<AskLookupModelOutput> = z.object({
  ...askModelOutputShape,
  lookups: z
    .array(
      z.object({
        kind: z.enum(AccountLookupKind),
        query: z.string().max(ASK_LOOKUP_QUERY_MAX_LENGTH),
      }),
    )
    .max(ASK_MAX_ACCOUNT_LOOKUPS)
    .describe('Read-only lookups of the caller’s workspace needed to answer; empty when none'),
});
