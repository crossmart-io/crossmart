import { BadRequestException } from '@nestjs/common';
import type { CatalogImportFormat } from '../enums/catalog-import-format.enum.js';

/** The parser registered for `format`, or a 400 when there is none. */
export function findParser<TParser extends { readonly format: CatalogImportFormat }>(
  parsers: readonly TParser[],
  format: CatalogImportFormat,
): TParser {
  const parser = parsers.find((candidate) => candidate.format === format);
  if (!parser) {
    throw new BadRequestException(`Unsupported import format: ${format}`);
  }
  return parser;
}
