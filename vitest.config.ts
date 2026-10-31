import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const WORKSPACE_LIBRARIES = ['common', 'connectors', 'database'];

const libraryAliases = WORKSPACE_LIBRARIES.map((library) => ({
  find: `@crossmart/${library}`,
  replacement: fileURLToPath(new URL(`./libs/${library}/src/index.ts`, import.meta.url)),
}));

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
    exclude: ['**/node_modules/**', 'dist/**'],
  },
});

export default defineConfig({
  ...sharedConfig,
  test: { ...sharedConfig.test, include: ['**/*.spec.ts'] },
});
