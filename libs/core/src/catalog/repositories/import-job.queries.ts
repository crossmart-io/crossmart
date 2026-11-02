import type { Prisma } from '@crossmart/database';

/** The names shown next to an import, loaded with the job in the same query. */
export const IMPORT_JOB_SUMMARY_INCLUDE = {
  user: { select: { name: true } },
  apiKey: { select: { name: true } },
} satisfies Prisma.ImportJobInclude;

export const IMPORT_JOB_DETAIL_INCLUDE = {
  ...IMPORT_JOB_SUMMARY_INCLUDE,
  issues: { orderBy: { position: 'asc' } },
} satisfies Prisma.ImportJobInclude;

export type ImportJobSummaryRecord = Prisma.ImportJobGetPayload<{
  include: typeof IMPORT_JOB_SUMMARY_INCLUDE;
}>;
export type ImportJobDetailRecord = Prisma.ImportJobGetPayload<{
  include: typeof IMPORT_JOB_DETAIL_INCLUDE;
}>;
