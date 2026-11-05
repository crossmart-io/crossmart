import type { Prisma } from '@crossmart/database';

const NAME_ONLY = { select: { name: true } } as const;

/** A suggestion with what the inbox shows about its product, channel and people. */
export const SUGGESTION_INCLUDE = {
  product: {
    select: {
      title: true,
      media: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
    },
  },
  connection: { select: { id: true, channel: true, displayName: true } },
  requestedByUser: NAME_ONLY,
  requestedByApiKey: NAME_ONLY,
  reviewedByUser: NAME_ONLY,
  reviewedByApiKey: NAME_ONLY,
} satisfies Prisma.SuggestionInclude;

export type SuggestionRecord = Prisma.SuggestionGetPayload<{ include: typeof SUGGESTION_INCLUDE }>;
