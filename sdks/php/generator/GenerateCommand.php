<?php

declare(strict_types=1);

namespace Crossmart\Generator;

use Crossmart\Generator\Spec\SpecDocument;
use Crossmart\Generator\Writer\GeneratedFile;
use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

/**
 * Writes the generated code under src/, or with `--check` fails when it is out of date.
 */
final class GenerateCommand
{
    public const SUCCESS = 0;
    public const FAILURE = 1;

    private const CHECK_FLAG = '--check';
    private const SPEC_ENVIRONMENT_VARIABLE = 'OPENAPI_SPEC';
    private const DEFAULT_SPEC_PATH = '/../../openapi.json';
    private const SOURCE_DIRECTORY = '/src';
    private const DIRECTORY_PERMISSIONS = 0o755;
    private const MISSING_SPEC_MESSAGE = "OpenAPI document not found at %s. Run `pnpm build:api && pnpm openapi:generate` in the repository root first.\n";
    private const OUT_OF_DATE_MESSAGE = <<<'TEXT'
        The generated code is out of date with %s:
        %s
        Run `pnpm build && pnpm openapi:generate` in the repository root, then `composer generate` in sdks/php, and commit the result.

        TEXT;

    public function __construct(private readonly string $packageRoot)
    {
    }

    /**
     * @param list<string> $arguments The command-line arguments, without the script name.
     */
    public function run(array $arguments): int
    {
        $specPath = $this->specPath($arguments);
        if (!is_file($specPath)) {
            fwrite(STDERR, sprintf(self::MISSING_SPEC_MESSAGE, $specPath));

            return self::FAILURE;
        }
        $files = (new CodeGenerator())->generate(SpecDocument::fromFile($specPath));
        $expected = [];
        foreach ($files as $file) {
            $expected[$file->relativePath] = $file->contents;
        }

        return in_array(self::CHECK_FLAG, $arguments, true)
            ? $this->check($expected, $specPath)
            : $this->write($expected, $specPath);
    }

    /**
     * @param list<string> $arguments
     */
    private function specPath(array $arguments): string
    {
        $positional = array_values(array_filter($arguments, static fn (string $argument): bool => $argument !== self::CHECK_FLAG));
        $fromEnvironment = getenv(self::SPEC_ENVIRONMENT_VARIABLE);

        return $positional[0] ?? (is_string($fromEnvironment) && $fromEnvironment !== '' ? $fromEnvironment : $this->packageRoot . self::DEFAULT_SPEC_PATH);
    }

    /**
     * @param array<string, string> $expected
     */
    private function check(array $expected, string $specPath): int
    {
        $current = $this->currentFiles();
        $paths = array_unique([...array_keys($expected), ...array_keys($current)]);
        sort($paths);
        $stale = array_values(array_filter(
            $paths,
            static fn (string $path): bool => ($expected[$path] ?? null) !== ($current[$path] ?? null),
        ));
        if ($stale !== []) {
            fwrite(STDERR, sprintf(self::OUT_OF_DATE_MESSAGE, $specPath, '  ' . implode("\n  ", $stale)));

            return self::FAILURE;
        }
        fwrite(STDOUT, sprintf("The generated code matches %s.\n", $specPath));

        return self::SUCCESS;
    }

    /**
     * @param array<string, string> $expected
     */
    private function write(array $expected, string $specPath): int
    {
        foreach (array_keys($this->currentFiles()) as $path) {
            unlink($this->absolute($path));
        }
        foreach ($expected as $path => $contents) {
            $absolute = $this->absolute($path);
            if (!is_dir(dirname($absolute))) {
                mkdir(dirname($absolute), self::DIRECTORY_PERMISSIONS, true);
            }
            file_put_contents($absolute, $contents);
        }
        fwrite(STDOUT, sprintf("Wrote %d files from %s.\n", count($expected), $specPath));

        return self::SUCCESS;
    }

    /**
     * The generated files on disk, by path under src/.
     *
     * @return array<string, string>
     */
    private function currentFiles(): array
    {
        $files = [];
        foreach (GeneratorConfig::OUTPUT_DIRECTORIES as $directory) {
            $absoluteDirectory = $this->absolute($directory);
            if (!is_dir($absoluteDirectory)) {
                continue;
            }
            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($absoluteDirectory, FilesystemIterator::SKIP_DOTS));
            foreach ($iterator as $file) {
                if ($file instanceof SplFileInfo && $file->isFile()) {
                    $relative = $directory . substr($file->getPathname(), strlen($absoluteDirectory));
                    $files[$relative] = (string) file_get_contents($file->getPathname());
                }
            }
        }

        return $files;
    }

    private function absolute(string $relativePath): string
    {
        return $this->packageRoot . self::SOURCE_DIRECTORY . '/' . $relativePath;
    }
}
