import { Prisma } from './generated/prisma/client.js';

/** Prisma's error code for a write that breaks a unique constraint. */
export const UNIQUE_VIOLATION_CODE = 'P2002';

/** Whether a write failed because a row with the same unique value already exists. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION_CODE
  );
}
