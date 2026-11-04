import { Actor } from '../../../../activity/entities/actor.js';
import type { CatalogImportRequest } from '../../../entities/catalog-import.js';
import type { CatalogImportFormat } from '../../../enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../../../enums/catalog-import-mode.enum.js';

export const IMPORT_ACTOR = Actor.user('user-1');

/** A request for a strategy test; the parser is mocked, so the content is never read. */
export function importRequest(
  format: CatalogImportFormat,
  mode: CatalogImportMode = CatalogImportMode.Create,
): CatalogImportRequest {
  return { mode, format, fileName: 'file.csv', content: Buffer.from(''), actor: IMPORT_ACTOR };
}
