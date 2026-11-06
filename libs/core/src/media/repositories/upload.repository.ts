import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@crossmart/database';
import type { ExpiredUpload, NewUpload } from '../entities/upload.js';
import { UPLOAD_IS_REFERENCED, utcTimestamp } from './upload.queries.js';

const NOTHING_STORED = 0n;
const NOTHING_CHANGED = 0;

/** A stored file waiting to be recorded, and the URL the storage serves it at. */
export interface ListedUpload {
  workspaceId: string;
  storageKey: string;
  url: string;
}

interface WorkspaceRow {
  workspaceId: string;
}

interface ReferencingUrl {
  storageKey: string;
  url: string;
}

/**
 * The `uploads` table: one row per file stored for a workspace. Every query is scoped to one
 * workspace, or matches uploads to product media of their own workspace only.
 */
@Injectable()
export class UploadRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Records a new upload; one the backfill recorded first is left as it is. */
  async record(upload: NewUpload): Promise<void> {
    await this.recordMissing([upload]);
  }

  /** Records the uploads not recorded yet, and returns how many it recorded. */
  async recordMissing(uploads: readonly NewUpload[]): Promise<number> {
    const { count } = await this.prisma.upload.createMany({
      data: uploads.map((upload) => UploadRepository.toRow(upload)),
      skipDuplicates: true,
    });
    return count;
  }

  /** The bytes the workspace stores, orphans included until they are deleted. */
  async usedBytes(workspaceId: string): Promise<number> {
    const { _sum: sum } = await this.prisma.upload.aggregate({
      where: { workspaceId },
      _sum: { byteSize: true },
    });
    return Number(sum.byteSize ?? NOTHING_STORED);
  }

  /**
   * Workspaces with cleanup to do: uploads to reclaim, to mark as orphans, or orphaned since
   * `cutoff` or earlier. At most `limit`.
   */
  async findWorkspacesToClean(cutoff: Date, limit: number): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<WorkspaceRow[]>`
      SELECT DISTINCT upload.workspace_id AS "workspaceId" FROM uploads upload
      WHERE (upload.orphaned_at IS NULL AND NOT ${UPLOAD_IS_REFERENCED})
         OR (upload.orphaned_at IS NOT NULL AND ${UPLOAD_IS_REFERENCED})
         OR upload.orphaned_at <= ${utcTimestamp(cutoff)}
      LIMIT ${limit}`;
    return rows.map(({ workspaceId }) => workspaceId);
  }

  /** Clears the orphan mark of the workspace's uploads a product uses again; at most `limit`. */
  reclaimReferenced(workspaceId: string, limit: number): Promise<number> {
    return this.prisma.$executeRaw`
      UPDATE uploads SET orphaned_at = NULL
      WHERE id IN (
        SELECT upload.id FROM uploads upload
        WHERE upload.workspace_id = ${workspaceId}::uuid
          AND upload.orphaned_at IS NOT NULL
          AND ${UPLOAD_IS_REFERENCED}
        LIMIT ${limit}
      )`;
  }

  /** Marks the workspace's uploads no product uses as orphaned at `now`; at most `limit`. */
  markOrphans(workspaceId: string, now: Date, limit: number): Promise<number> {
    return this.prisma.$executeRaw`
      UPDATE uploads SET orphaned_at = ${utcTimestamp(now)}
      WHERE orphaned_at IS NULL AND id IN (
        SELECT upload.id FROM uploads upload
        WHERE upload.workspace_id = ${workspaceId}::uuid
          AND upload.orphaned_at IS NULL
          AND NOT ${UPLOAD_IS_REFERENCED}
        LIMIT ${limit}
      )`;
  }

  /** The workspace's uploads orphaned since `cutoff` or earlier, oldest first; at most `limit`. */
  findExpiredOrphans(workspaceId: string, cutoff: Date, limit: number): Promise<ExpiredUpload[]> {
    return this.prisma.upload.findMany({
      where: { workspaceId, orphanedAt: { lte: cutoff } },
      select: { id: true, storageKey: true },
      orderBy: { orphanedAt: Prisma.SortOrder.asc },
      take: limit,
    });
  }

  /**
   * Deletes the upload if it is still an orphan since `cutoff` and no product uses it, then
   * `deleteFile` in the same transaction: when the file cannot be deleted the row stays, and the
   * next run tries again. False when the upload was attached again in the meantime.
   */
  deleteExpiredOrphan(
    upload: ExpiredUpload,
    cutoff: Date,
    deleteFile: (storageKey: string) => Promise<void>,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const deleted = await transaction.$executeRaw`
        DELETE FROM uploads upload
        WHERE upload.id = ${upload.id}::uuid
          AND upload.orphaned_at <= ${utcTimestamp(cutoff)}
          AND NOT ${UPLOAD_IS_REFERENCED}`;
      if (deleted === NOTHING_CHANGED) return false;
      await deleteFile(upload.storageKey);
      return true;
    });
  }

  /**
   * For each listed file a product of its workspace uses, the URL it uses: the storage's own
   * URL when it is among them, otherwise one ending in the file's key (an older media URL).
   */
  async findReferencingUrls(files: readonly ListedUpload[]): Promise<Map<string, string>> {
    const rows = await this.prisma.$queryRaw<ReferencingUrl[]>`
      SELECT DISTINCT ON (file.storage_key) file.storage_key AS "storageKey", media.url
      FROM unnest(
        ${files.map(({ storageKey }) => storageKey)}::text[],
        ${files.map(({ workspaceId }) => workspaceId)}::uuid[],
        ${files.map(({ url }) => url)}::text[]
      ) AS file(storage_key, workspace_id, url)
      JOIN product_media media
        ON media.workspace_id = file.workspace_id
       AND media.url LIKE ('%/' || file.storage_key)
      ORDER BY file.storage_key, (media.url = file.url) DESC, media.url`;
    return new Map(rows.map(({ storageKey, url }) => [storageKey, url]));
  }

  private static toRow(upload: NewUpload): Prisma.UploadCreateManyInput {
    return { ...upload, byteSize: BigInt(upload.byteSize) };
  }
}
