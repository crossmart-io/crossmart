import { Module } from '@nestjs/common';
import {
  AesGcmEnvelopeEncryption,
  AppConfigService,
  DataKeyStore,
  EnvelopeEncryption,
  MasterKeyRing,
} from '@crossmart/common';
import { PrismaDataKeyStore } from './repositories/prisma-data-key.store.js';

/**
 * Envelope encryption for secrets at rest: per-workspace data keys in the database, wrapped
 * by `CREDENTIALS_MASTER_KEY`. An invalid key fails the boot; a missing one only disables
 * connecting channels.
 */
@Module({
  providers: [
    {
      provide: MasterKeyRing,
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) =>
        MasterKeyRing.fromSettings(appConfig.masterKeySettings),
    },
    { provide: DataKeyStore, useClass: PrismaDataKeyStore },
    {
      provide: EnvelopeEncryption,
      inject: [MasterKeyRing, DataKeyStore],
      useFactory: (masterKeys: MasterKeyRing, dataKeys: DataKeyStore) =>
        new AesGcmEnvelopeEncryption(masterKeys, dataKeys),
    },
  ],
  exports: [EnvelopeEncryption],
})
export class CredentialsModule {}
