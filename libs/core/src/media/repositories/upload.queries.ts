import { Prisma } from '@crossmart/database';

/** True when a product medium of the upload's own workspace uses its URL. Needs `upload` in scope. */
export const UPLOAD_IS_REFERENCED = Prisma.sql`EXISTS (
  SELECT 1 FROM product_media media
  WHERE media.workspace_id = upload.workspace_id AND media.url = upload.url
)`;

/**
 * `moment` as the UTC `timestamp(3)` Prisma stores dates in, whatever the session's time zone.
 */
export function utcTimestamp(moment: Date): Prisma.Sql {
  return Prisma.sql`(${moment.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
}
