import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crossmartVersion, readPackageVersion } from './package-version.js';
import {
  CROSSMART_PACKAGE_NAME,
  PACKAGE_MANIFEST_FILE,
  UNKNOWN_PACKAGE_VERSION,
} from './package.constants.js';

const writeManifest = (directory: string, manifest: object | string): void => {
  const contents = typeof manifest === 'string' ? manifest : JSON.stringify(manifest);
  writeFileSync(join(directory, PACKAGE_MANIFEST_FILE), contents);
};

describe('readPackageVersion', () => {
  let root: string;
  let entryDirectory: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'package-version-'));
    entryDirectory = join(root, 'dist', 'apps', 'mcp');
    mkdirSync(entryDirectory, { recursive: true });
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('finds the named package above the start directory', () => {
    writeManifest(root, { name: CROSSMART_PACKAGE_NAME, version: '1.2.3' });
    expect(readPackageVersion(entryDirectory, CROSSMART_PACKAGE_NAME)).toBe('1.2.3');
  });

  it('skips manifests of other packages and unreadable ones on the way up', () => {
    writeManifest(root, { name: CROSSMART_PACKAGE_NAME, version: '1.2.3' });
    writeManifest(join(root, 'dist'), { name: 'other', version: '9.9.9' });
    writeManifest(join(root, 'dist', 'apps'), '{ not json');
    expect(readPackageVersion(entryDirectory, CROSSMART_PACKAGE_NAME)).toBe('1.2.3');
  });

  it('falls back when no manifest names the package', () => {
    writeManifest(root, { name: 'other', version: '9.9.9' });
    expect(readPackageVersion(entryDirectory, `${CROSSMART_PACKAGE_NAME}-missing`)).toBe(
      UNKNOWN_PACKAGE_VERSION,
    );
  });

  it('ignores a manifest whose version is not a string', () => {
    writeManifest(entryDirectory, { name: CROSSMART_PACKAGE_NAME, version: 1 });
    writeManifest(root, { name: CROSSMART_PACKAGE_NAME, version: '1.2.3' });
    expect(readPackageVersion(entryDirectory, CROSSMART_PACKAGE_NAME)).toBe('1.2.3');
  });

  it('reads the version from the entry script directory', () => {
    writeManifest(root, { name: CROSSMART_PACKAGE_NAME, version: '4.5.6' });
    expect(crossmartVersion(join(entryDirectory, 'main.js'))).toBe('4.5.6');
  });
});
