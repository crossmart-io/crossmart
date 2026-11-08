import { readFileSync } from 'node:fs';
import { CROSSMART_PACKAGE_NAME } from '@crossmart/common/package/package.constants.js';
import { SERVER_VERSION } from './create-mcp-server.js';

const ROOT_MANIFEST = new URL('../../../../package.json', import.meta.url);

describe('SERVER_VERSION', () => {
  it('is the version in the root package.json, without npm_package_version', () => {
    const manifest = JSON.parse(readFileSync(ROOT_MANIFEST, 'utf8')) as {
      name: string;
      version: string;
    };
    expect(manifest.name).toBe(CROSSMART_PACKAGE_NAME);
    expect(SERVER_VERSION).toBe(manifest.version);
  });
});
