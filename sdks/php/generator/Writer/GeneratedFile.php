<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

use Crossmart\Generator\GeneratorConfig;
use Crossmart\Generator\Type\Imports;

/**
 * A generated PHP file, by its path under src/.
 */
final class GeneratedFile
{
    private const NAMESPACE_SEPARATOR = '\\';
    private const FILE_EXTENSION = '.php';

    private function __construct(
        public readonly string $relativePath,
        public readonly string $contents,
    ) {
    }

    /**
     * @param list<string> $body The lines after the `use` statements.
     */
    public static function forClass(string $namespace, string $className, Imports $imports, array $body): self
    {
        $uses = $imports->statements();
        $lines = [
            GeneratorConfig::FILE_HEADER,
            '',
            sprintf('namespace %s;', $namespace),
            '',
            ...($uses === [] ? [] : [...$uses, '']),
            ...$body,
        ];
        $directory = GeneratorConfig::OUTPUT_DIRECTORIES[$namespace] ?? str_replace(self::NAMESPACE_SEPARATOR, '/', $namespace);

        return new self($directory . '/' . $className . self::FILE_EXTENSION, implode("\n", $lines) . "\n");
    }
}
