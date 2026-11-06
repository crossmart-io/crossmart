<?php

declare(strict_types=1);

namespace Crossmart\Generator;

use Crossmart\Generator\Spec\Operation;
use Crossmart\Generator\Spec\SpecDocument;
use Crossmart\Generator\Type\TypeResolver;
use Crossmart\Generator\Writer\ApiClientsWriter;
use Crossmart\Generator\Writer\ApiWriter;
use Crossmart\Generator\Writer\DocBlock;
use Crossmart\Generator\Writer\EnumWriter;
use Crossmart\Generator\Writer\GeneratedFile;
use Crossmart\Generator\Writer\ModelWriter;
use Crossmart\Generator\Writer\NameFormatter;

/**
 * Turns the OpenAPI document into the enums, models and operation classes of the SDK.
 */
final class CodeGenerator
{
    /**
     * @return list<GeneratedFile>
     */
    public function generate(SpecDocument $document): array
    {
        $schemas = $document->schemas();
        $types = new TypeResolver($schemas);
        $names = new NameFormatter();
        $docBlock = new DocBlock();
        $enumWriter = new EnumWriter($names, $docBlock);
        $modelWriter = new ModelWriter($types, $names, $docBlock);
        $apiWriter = new ApiWriter($types, $names, $docBlock);

        $files = [];
        foreach ($schemas as $name => $schema) {
            $files[] = $schema->isEnum() ? $enumWriter->write($name, $schema) : $modelWriter->write($name, $schema);
        }
        $operationsByTag = $this->operationsByTag($document->operations());
        foreach ($operationsByTag as $tag => $operations) {
            $files[] = $apiWriter->write($tag, $operations);
        }
        $files[] = (new ApiClientsWriter($apiWriter, $names, $docBlock))->write(array_map('strval', array_keys($operationsByTag)));

        return $files;
    }

    /**
     * Operations with a body other than JSON (file uploads) are left out.
     *
     * @param list<Operation> $operations
     *
     * @return array<string, list<Operation>>
     */
    private function operationsByTag(array $operations): array
    {
        $grouped = [];
        foreach ($operations as $operation) {
            if (!$operation->hasUnsupportedBody) {
                $grouped[$operation->tag][] = $operation;
            }
        }

        return $grouped;
    }
}
