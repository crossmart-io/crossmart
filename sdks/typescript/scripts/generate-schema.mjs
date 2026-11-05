#!/usr/bin/env node
/**
 * Generates `src/generated/schema.ts` from the Crossmart OpenAPI spec.
 *
 *   pnpm generate      writes the file
 *   pnpm check:drift   fails when the committed file differs from a fresh generation
 *
 * The spec is `../../openapi.json` (produced by `pnpm openapi:generate` in the backend root).
 * Set `OPENAPI_SPEC` to read another file.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const DEFAULT_SPEC_PATH = resolve(PACKAGE_ROOT, '../../openapi.json');
const SCHEMA_PATH = resolve(PACKAGE_ROOT, 'src/generated/schema.ts');
const CHECK_FLAG = '--check';
const FAILURE_EXIT_CODE = 1;

/**
 * Closed sets of values become TypeScript enums, as in crossmart-web. Fields with a server-side
 * default stay optional, so request bodies only need what the API requires.
 */
const GENERATOR_OPTIONS = { enum: true, defaultNonNullable: false };

async function renderSchema(specPath) {
  const spec = JSON.parse(await readFile(specPath, 'utf8'));
  const ast = await openapiTS(spec, GENERATOR_OPTIONS);
  return COMMENT_HEADER + astToString(ast);
}

async function readCommittedSchema() {
  try {
    return await readFile(SCHEMA_PATH, 'utf8');
  } catch {
    return '';
  }
}

async function main() {
  const specPath = resolve(process.env.OPENAPI_SPEC ?? DEFAULT_SPEC_PATH);
  const schema = await renderSchema(specPath);

  if (!process.argv.includes(CHECK_FLAG)) {
    await writeFile(SCHEMA_PATH, schema);
    process.stdout.write(`Wrote ${SCHEMA_PATH} from ${specPath}\n`);
    return;
  }

  if ((await readCommittedSchema()) !== schema) {
    process.stderr.write(
      `src/generated/schema.ts is out of date with ${specPath}.\n` +
        'Run `pnpm openapi:generate` in the backend root, then `pnpm generate` in sdks/typescript, ' +
        'and commit the result.\n',
    );
    process.exit(FAILURE_EXIT_CODE);
  }
  process.stdout.write('src/generated/schema.ts matches the OpenAPI spec.\n');
}

await main();
