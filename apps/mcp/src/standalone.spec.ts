import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_DIR = import.meta.dirname;
/** Library entry points that load Nest modules, whose config check needs the API's settings. */
const HEAVY_ENTRY_POINTS = /from '@crossmart\/(core|database|common|connectors)'/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('MCP server', () => {
  it('imports only plain files from the libraries, so it starts without database settings', () => {
    const offenders = sourceFiles(SOURCE_DIR).filter((file) =>
      HEAVY_ENTRY_POINTS.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});
