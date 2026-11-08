import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  CROSSMART_PACKAGE_NAME,
  PACKAGE_MANIFEST_FILE,
  UNKNOWN_PACKAGE_VERSION,
} from './package.constants.js';

interface PackageManifest {
  name?: unknown;
  version?: unknown;
}

/**
 * The version in the nearest `package.json` named `packageName`, searched from `startDirectory`
 * up to the filesystem root. It does not depend on `npm_package_version`, which is only set when
 * a package manager starts the process, so a plain `node dist/...` (the Docker image, an MCP
 * client) reports the same version. Falls back to {@link UNKNOWN_PACKAGE_VERSION}.
 */
export function readPackageVersion(startDirectory: string, packageName: string): string {
  let directory = startDirectory;
  for (;;) {
    const version = manifestVersion(join(directory, PACKAGE_MANIFEST_FILE), packageName);
    if (version) return version;
    const parent = dirname(directory);
    if (parent === directory) return UNKNOWN_PACKAGE_VERSION;
    directory = parent;
  }
}

/**
 * Crossmart's version, found from the entry script's directory (`dist/apps/<app>/main.js` sits
 * inside the repository or image). Not `import.meta.url`: the bundler fixes that to the source
 * path at build time. Without an entry script, it searches from the working directory.
 */
export function crossmartVersion(entryScript: string | undefined = process.argv[1]): string {
  const startDirectory = entryScript ? dirname(entryScript) : process.cwd();
  return readPackageVersion(startDirectory, CROSSMART_PACKAGE_NAME);
}

function manifestVersion(path: string, packageName: string): string | undefined {
  const manifest = readManifest(path);
  if (manifest?.name !== packageName) return undefined;
  return typeof manifest.version === 'string' ? manifest.version : undefined;
}

function readManifest(path: string): PackageManifest | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as PackageManifest;
  } catch {
    return undefined;
  }
}
