import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service.js';
import { FileStorage } from './file-storage.js';
import { LocalFileStorage } from './local-file-storage.js';
import { StorageDriver } from './storage-driver.enum.js';

function createFileStorage(appConfig: AppConfigService): FileStorage {
  switch (appConfig.storageDriver) {
    case StorageDriver.Local:
      return new LocalFileStorage(appConfig.storageLocalDir, appConfig.mediaPublicUrl);
  }
}

/** Provides the configured `FileStorage`. */
@Global()
@Module({
  providers: [{ provide: FileStorage, useFactory: createFileStorage, inject: [AppConfigService] }],
  exports: [FileStorage],
})
export class StorageModule {}
