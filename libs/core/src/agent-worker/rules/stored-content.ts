import { z } from 'zod';
import type { AiContentBlock } from '../../ai/entities/ai-conversation.js';
import { AiContentBlockType } from '../../ai/enums/ai-content-block-type.enum.js';
import { AiProviderName } from '../../ai/enums/ai-provider-name.enum.js';

const STORED_BLOCK = z.discriminatedUnion('type', [
  z.object({ type: z.literal(AiContentBlockType.Text), text: z.string() }),
  z.object({
    type: z.literal(AiContentBlockType.ToolUse),
    id: z.string(),
    name: z.string(),
    input: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal(AiContentBlockType.ToolResult),
    toolUseId: z.string(),
    content: z.string(),
    isError: z.boolean(),
  }),
  z.object({
    type: z.literal(AiContentBlockType.ProviderSpecific),
    provider: z.enum(AiProviderName),
    value: z.unknown(),
  }),
]);

const STORED_CONTENT = z.array(STORED_BLOCK);

/**
 * A stored message's content blocks, checked on the way out of the database. A row that does
 * not parse (written by a newer release) reads as empty rather than breaking the conversation.
 */
export function parseStoredContent(json: unknown): AiContentBlock[] {
  const parsed = STORED_CONTENT.safeParse(json);
  return parsed.success ? (parsed.data as AiContentBlock[]) : [];
}
