import { ServiceUnavailableException } from '@nestjs/common';
import { ChannelType } from '@crossmart/connectors';
import { Actor } from '../../../activity/entities/actor.js';
import type { ImportJobDetail } from '../../../catalog/entities/import-job.js';
import { CatalogImportFormat } from '../../../catalog/enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../../../catalog/enums/catalog-import-mode.enum.js';
import type { ImportJobsService } from '../../../catalog/services/import-jobs.service.js';
import { IMPORT_QUEUE_UNAVAILABLE } from '../channel-import.constants.js';
import type { ChannelImportQueue } from '../queue/channel-import.queue.js';
import type { ChannelImportJobRepository } from '../repositories/channel-import-job.repository.js';
import type { ChannelCatalogOpener } from './channel-catalog.opener.js';
import { ChannelImportService } from './channel-import.service.js';

const ACTOR = Actor.user('user-1');
const DETAIL = { id: 'job-1' } as ImportJobDetail;

function setup(created: boolean, enqueue = vi.fn<ChannelImportQueue['enqueue']>()) {
  const catalogs = {
    requireImportable: vi.fn(() =>
      Promise.resolve({ channel: ChannelType.Shopify, displayName: 'Demo Store' }),
    ),
  };
  const jobs = {
    startOrFindRunning: vi.fn(() => Promise.resolve({ jobId: 'job-1', created })),
    fail: vi.fn(),
  };
  const history = { get: vi.fn(() => Promise.resolve(DETAIL)) };
  const service = new ChannelImportService(
    catalogs as unknown as ChannelCatalogOpener,
    jobs as unknown as ChannelImportJobRepository,
    { enqueue } as ChannelImportQueue,
    history as unknown as ImportJobsService,
  );
  return { service, jobs, enqueue, catalogs };
}

describe('ChannelImportService', () => {
  it('records a create-or-link import of the store and queues it', async () => {
    const { service, jobs, enqueue, catalogs } = setup(true);

    await expect(service.start('ws-1', 'conn-1', ACTOR)).resolves.toBe(DETAIL);

    expect(catalogs.requireImportable).toHaveBeenCalledWith('ws-1', 'conn-1');
    expect(jobs.startOrFindRunning).toHaveBeenCalledWith('ws-1', {
      mode: CatalogImportMode.CreateOrLink,
      format: CatalogImportFormat.ShopifyApi,
      fileName: 'Demo Store',
      actor: ACTOR,
      connectionId: 'conn-1',
    });
    expect(enqueue).toHaveBeenCalledWith({ workspaceId: 'ws-1', jobId: 'job-1' });
  });

  it('returns the running import instead of queuing another', async () => {
    const { service, enqueue } = setup(false);

    await expect(service.start('ws-1', 'conn-1', ACTOR)).resolves.toBe(DETAIL);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('fails the import when it cannot be queued', async () => {
    const { service, jobs } = setup(
      true,
      vi.fn(() => Promise.reject(new Error('redis down'))),
    );

    await expect(service.start('ws-1', 'conn-1', ACTOR)).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(jobs.fail).toHaveBeenCalledWith('ws-1', 'job-1', IMPORT_QUEUE_UNAVAILABLE);
  });
});
