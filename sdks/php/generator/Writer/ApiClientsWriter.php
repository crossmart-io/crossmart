<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

use Crossmart\Generator\GeneratorConfig;
use Crossmart\Generator\Type\Imports;

/**
 * Writes the class that holds one API class per tag.
 */
final class ApiClientsWriter
{
    private const INDENT = '    ';
    private const DOUBLE_INDENT = '        ';

    public function __construct(
        private readonly ApiWriter $apiWriter,
        private readonly NameFormatter $names,
        private readonly DocBlock $docBlock,
    ) {
    }

    /**
     * @param list<string> $tags
     */
    public function write(array $tags): GeneratedFile
    {
        $imports = new Imports(GeneratorConfig::API_NAMESPACE);
        $properties = array_map(
            fn (string $tag): string => sprintf('%spublic readonly %s $%s;', self::INDENT, $this->apiWriter->className($tag), $this->propertyName($tag)),
            $tags,
        );
        $assignments = array_map(
            fn (string $tag): string => sprintf('%s$this->%s = new %s($transport);', self::DOUBLE_INDENT, $this->propertyName($tag), $this->apiWriter->className($tag)),
            $tags,
        );
        $body = [
            ...$this->docBlock->render(['Every operation of the API, grouped by tag.'], []),
            sprintf('final class %s', GeneratorConfig::API_CLIENTS_CLASS),
            '{',
            ...$properties,
            '',
            sprintf('%spublic function __construct(%s $transport)', self::INDENT, $imports->use(GeneratorConfig::TRANSPORT_CLASS)),
            self::INDENT . '{',
            ...$assignments,
            self::INDENT . '}',
            '}',
        ];

        return GeneratedFile::forClass(GeneratorConfig::API_NAMESPACE, GeneratorConfig::API_CLIENTS_CLASS, $imports, $body);
    }

    private function propertyName(string $tag): string
    {
        return $this->names->camelCase($tag);
    }
}
