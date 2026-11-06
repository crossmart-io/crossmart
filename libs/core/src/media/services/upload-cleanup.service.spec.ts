import type { FileStorage } from '@crossmart/common';
import type { ExpiredUpload } from '../entities/upload.js';
import {
  UPLOAD_CLEANUP_BATCH_SIZE,
  UPLOAD_CLEANUP_WORKSPACES_PER_RUN,
  UPLOAD_ORPHAN_GRACE_MS,
} from '../media.constants.js';
import type { UploadRepository } from '../repositories/upload.repository.js';
import { UploadCleanupService } from './upload-cleanup.service.js';

const NOW = new Date('2026-11-09T12:00:00Z');
const CUTOFF = new Date(NOW.getTime() - UPLOAD_ORPHAN_GRACE_MS);

const EXPIRED: Record<string, ExpiredUpload[]> = {
  'ws-1': [
    { id: 'up-1', storageKey: 'workspaces/ws-1/products/a.png' },
    { id: 'up-2', storageKey: 'workspaces/ws-1/products/b.png' },
  ],
  'ws-2': [{ id: 'up-3', storageKey: 'workspaces/ws-2/products/c.png' }],
};

function createService() {
  const uploads = {
    findWorkspacesToClean: vi
      .fn<UploadRepository['findWorkspacesToClean']>()
      .mockResolvedValue(Object.keys(EXPIRED)),
    reclaimReferenced: vi.fn<UploadRepository['reclaimReferenced']>().mockResolvedValue(1),
    markOrphans: vi.fn<UploadRepository['markOrphans']>().mockResolvedValue(2),
    findExpiredOrphans: vi
      .fn<UploadRepository['findExpiredOrphans']>()
      .mockImplementation((workspaceId) => Promise.resolve(EXPIRED[workspaceId] ?? [])),
    deleteExpiredOrphan: vi
      .fn<UploadRepository['deleteExpiredOrphan']>()
      .mockImplementation(async (upload, _cutoff, deleteFile) => {
        await deleteFile(upload.storageKey);
        return true;
      }),
  };
  const storage = { delete: vi.fn<FileStorage['delete']>().mockResolvedValue() };
  const service = new UploadCleanupService(
    uploads as unknown as UploadRepository,
    storage as unknown as FileStorage,
  );
  return { service, uploads, storage };
}

describe('UploadCleanupService.cleanUpWorkspace', () => {
  it('reclaims used uploads, marks new orphans, and deletes the expired ones', async () => {
    const { service, uploads, storage } = createService();

    const report = await service.cleanUpWorkspace('ws-1', NOW);

    expect(report).toEqual({ reclaimed: 1, orphaned: 2, deleted: 2, failed: 0 });
    expect(uploads.reclaimReferenced).toHaveBeenCalledWith('ws-1', UPLOAD_CLEANUP_BATCH_SIZE);
    expect(uploads.markOrphans).toHaveBeenCalledWith('ws-1', NOW, UPLOAD_CLEANUP_BATCH_SIZE);
    expect(uploads.findExpiredOrphans).toHaveBeenCalledWith(
      'ws-1',
      CUTOFF,
      UPLOAD_CLEANUP_BATCH_SIZE,
    );
    expect(storage.delete.mock.calls.map(([key]) => key)).toEqual([
      'workspaces/ws-1/products/a.png',
      'workspaces/ws-1/products/b.png',
    ]);
  });

  it('only deletes uploads orphaned for the whole grace period', async () => {
    const { service, uploads } = createService();

    await service.cleanUpWorkspace('ws-1', NOW);

    expect(uploads.deleteExpiredOrphan.mock.calls.map(([, cutoff]) => cutoff)).toEqual([
      CUTOFF,
      CUTOFF,
    ]);
  });

  it('does not count an upload attached again before its deletion', async () => {
    const { service, uploads, storage } = createService();
    uploads.deleteExpiredOrphan.mockResolvedValueOnce(false);

    const report = await service.cleanUpWorkspace('ws-1', NOW);

    expect(report.deleted).toBe(1);
    expect(storage.delete).toHaveBeenCalledTimes(1);
  });

  it('counts a failed deletion and carries on with the others', async () => {
    const { service, uploads } = createService();
    uploads.deleteExpiredOrphan.mockRejectedValueOnce(new Error('storage unreachable'));

    const report = await service.cleanUpWorkspace('ws-1', NOW);

    expect(report).toMatchObject({ deleted: 1, failed: 1 });
  });
});

describe('UploadCleanupService.cleanUp', () => {
  it('cleans up each workspace with work to do, and adds up their counts', async () => {
    const { service, uploads } = createService();

    const report = await service.cleanUp(NOW);

    expect(uploads.findWorkspacesToClean).toHaveBeenCalledWith(
      CUTOFF,
      UPLOAD_CLEANUP_WORKSPACES_PER_RUN,
    );
    expect(uploads.markOrphans.mock.calls.map(([workspaceId]) => workspaceId)).toEqual([
      'ws-1',
      'ws-2',
    ]);
    expect(report).toEqual({ reclaimed: 2, orphaned: 4, deleted: 3, failed: 0 });
  });

  it('does nothing when no workspace has cleanup to do', async () => {
    const { service, uploads } = createService();
    uploads.findWorkspacesToClean.mockResolvedValue([]);

    const report = await service.cleanUp(NOW);

    expect(report).toEqual({ reclaimed: 0, orphaned: 0, deleted: 0, failed: 0 });
    expect(uploads.markOrphans).not.toHaveBeenCalled();
  });
});
