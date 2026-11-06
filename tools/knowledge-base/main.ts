/**
 * Builds Ask Crossmart's knowledge index (ADR 0022) from the public docs:
 *
 *   pnpm knowledge:build -- --docs-dir ../crossmart-docs
 *
 * Reads every page of a crossmart-docs checkout and this repository's public documents, splits
 * them into sections with their public URLs, and writes them to `OUTPUT_FILE`. Commit the
 * result. Plans are not read here: Ask reads them from the database at run time.
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DEFAULT_DOCS_DIR, DOCS_DIR_FLAG, OUTPUT_FILE } from './knowledge-base.constants.js';
import { pageChunks } from './page-chunks.js';
import { docsPages, repositoryPages } from './page-collector.js';
import { renderModule } from './render-module.js';

const NEXT_ARGUMENT = 1;

function docsDirFromArguments(argv: readonly string[]): string {
  const flagAt = argv.indexOf(DOCS_DIR_FLAG);
  return resolve(
    flagAt >= 0 ? (argv[flagAt + NEXT_ARGUMENT] ?? DEFAULT_DOCS_DIR) : DEFAULT_DOCS_DIR,
  );
}

async function main(): Promise<void> {
  const repositoryDir = process.cwd();
  const pages = [
    ...(await docsPages(docsDirFromArguments(process.argv))),
    ...(await repositoryPages(repositoryDir)),
  ];
  const chunks = pages.flatMap(pageChunks);
  const outputPath = resolve(repositoryDir, OUTPUT_FILE);
  await writeFile(outputPath, await renderModule(chunks, outputPath));
  process.stdout.write(
    `Wrote ${chunks.length} chunks from ${pages.length} pages to ${OUTPUT_FILE}\n`,
  );
}

await main();
