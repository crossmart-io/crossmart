import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { requireEnumValue } from '@crossmart/common';
import { ChannelType } from '@crossmart/connectors';
import type { Actor } from '../../../activity/entities/actor.js';
import type { ImportJobDetail } from '../../../catalog/entities/import-job.js';
import type { CatalogImportFormat } from '../../../catalog/enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../../../catalog/enums/catalog-import-mode.enum.js';
import { ImportJobsService } from '../../../catalog/services/import-jobs.service.js';
import {
  CHANNEL_IMPORT_FORMATS,
  IMPORT_NOT_SUPPORTED,
  IMPORT_QUEUE_UNAVAILABLE,
} from '../channel-import.constants.js';
import { ChannelImportQueue } from '../queue/channel-import.queue.js';
import { ChannelImportJobRepository } from '../repositories/channel-import-job.repository.js';
import { ChannelCatalogOpener } from './channel-catalog.opener.js';

/**
 * Starts importing a connected channel's catalog into the workspace. The import runs in the
 * worker; its import history entry shows the progress. Starting while an import of the same
 * connection runs returns that import, so repeated requests never import twice at once.
 */
@Injectable()
export class ChannelImportService {
  constructor(
    private readonly catalogs: ChannelCatalogOpener,
    private readonly jobs: ChannelImportJobRepository,
    private readonly queue: ChannelImportQueue,
    private readonly history: ImportJobsService,
  ) {}

  async start(workspaceId: string, connectionId: string, actor: Actor): Promise<ImportJobDetail> {
    const connection = await this.catalogs.requireImportable(workspaceId, connectionId);
    const started = await this.jobs.startOrFindRunning(workspaceId, {
      mode: CatalogImportMode.CreateOrLink,
      format: this.formatOf(connection.channel),
      fileName: connection.displayName,
      actor,
      connectionId,
    });
    if (started.created) {
      await this.enqueue(workspaceId, started.jobId);
    }
    return this.history.get(workspaceId, started.jobId);
  }

  private formatOf(channel: string): CatalogImportFormat {
    const format = CHANNEL_IMPORT_FORMATS[requireEnumValue(ChannelType, channel)];
    if (!format) {
      throw new BadRequestException(IMPORT_NOT_SUPPORTED);
    }
    return format;
  }

  /** An import that cannot be queued is marked failed, so it never blocks the next one. */
  private async enqueue(workspaceId: string, jobId: string): Promise<void> {
    try {
      await this.queue.enqueue({ workspaceId, jobId });
    } catch {
      await this.jobs.fail(workspaceId, jobId, IMPORT_QUEUE_UNAVAILABLE);
      throw new ServiceUnavailableException(IMPORT_QUEUE_UNAVAILABLE);
    }
  }
}
