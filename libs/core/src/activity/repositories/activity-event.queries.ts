import type { Prisma } from '@crossmart/database';

/** Actor names come in the same query as the events, so a page never costs one query per row. */
export const ACTIVITY_EVENT_INCLUDE = {
  actorUser: { select: { name: true, email: true } },
  actorApiKey: { select: { name: true } },
  actorOAuthClient: { select: { name: true } },
  actorApprovedBy: { select: { name: true } },
} satisfies Prisma.ActivityEventInclude;

export type ActivityEventRecord = Prisma.ActivityEventGetPayload<{
  include: typeof ACTIVITY_EVENT_INCLUDE;
}>;
