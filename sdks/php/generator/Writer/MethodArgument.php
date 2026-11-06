<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

use Crossmart\Generator\Type\Imports;
use Crossmart\Generator\Type\PhpType;

/**
 * A parameter of a generated operation method.
 */
final class MethodArgument
{
    public function __construct(
        public readonly string $name,
        public readonly PhpType $type,
        public readonly bool $required,
        public readonly ?string $description,
    ) {
    }

    public function declaration(Imports $imports): string
    {
        return $this->required
            ? sprintf('%s $%s', $this->type->native($imports), $this->name)
            : sprintf('%s $%s = null', $this->type->nullableNative($imports), $this->name);
    }

    /**
     * The `@param` tag, or null when the signature already says everything.
     */
    public function paramTag(Imports $imports, DocBlock $docBlock): ?string
    {
        $docType = $this->type->doc($imports);
        if ($docType === null && $this->description === null) {
            return null;
        }
        $type = ($docType ?? $this->type->native($imports)) . ($this->required ? '' : '|null');

        return rtrim(sprintf('@param %s $%s %s', $type, $this->name, $docBlock->inline($this->description)));
    }
}
