import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const WORKSPACE_LIBRARIES = ['common', 'connectors', 'core', 'database'];

const librarySource = (library: string): string =>
  fileURLToPath(new URL(`./libs/${library}/src/`, import.meta.url));

/** `@crossmart/<library>` is its index, and `@crossmart/<library>/<path>` a file in it (as in tsconfig). */
const libraryAliases = WORKSPACE_LIBRARIES.flatMap((library) => [
  { find: new RegExp(`^@crossmart/${library}$`), replacement: `${librarySource(library)}index.ts` },
  { find: new RegExp(`^@crossmart/${library}/(.*)$`), replacement: `${librarySource(library)}$1` },
]);

/** Shared by unit and e2e runs. NestJS relies on legacy decorators and their emitted metadata. */
export const sharedConfig = defineConfig({
  resolve: { alias: libraryAliases },
  oxc: {
    decorator: { legacy: true, emitDecoratorMetadata: true },
  },
  test: {
    globals: true,
    root: './',
    setupFiles: ['reflect-metadata'],
    // SDKs are standalone packages with their own test runs (see sdks/*/package.json).
    exclude: ['**/node_modules/**', 'dist/**', 'sdks/**', '.claude/**'],
  },
});

export default defineConfig({
  ...sharedConfig,
  test: { ...sharedConfig.test, include: ['**/*.spec.ts'] },
});
