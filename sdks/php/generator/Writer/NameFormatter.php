<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

use UnexpectedValueException;

/**
 * Turns names from the OpenAPI document into PHP identifiers.
 */
final class NameFormatter
{
    private const WORD_PATTERN = '/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+[a-z]*/';
    private const IDENTIFIER_PATTERN = '/^[A-Za-z_][A-Za-z0-9_]*$/';
    private const DIGIT_PREFIX = 'Value';
    private const NUMERIC_WORD_SEPARATOR = '_';

    /**
     * `ProductsController_list_v1` becomes `productsControllerListV1`.
     */
    public function camelCase(string $name): string
    {
        return lcfirst($this->pascalCase($name));
    }

    /**
     * `API keys` becomes `ApiKeys`, `last_30_days` becomes `Last30Days`.
     */
    public function pascalCase(string $name): string
    {
        return implode('', array_map($this->capitalize(...), $this->words($name)));
    }

    /**
     * An enum case for a value. Values that start with a digit, such as `2020_2026`, keep the
     * separator between numbers and get a prefix: `Value2020_2026`.
     */
    public function enumCase(string $value): string
    {
        $words = array_map($this->capitalize(...), $this->words($value));
        if ($words === [] || !ctype_digit($value[0])) {
            return $this->identifier(implode('', $words));
        }

        return $this->identifier(self::DIGIT_PREFIX . implode(self::NUMERIC_WORD_SEPARATOR, $words));
    }

    /**
     * Fails when a name from the document cannot be used as is in PHP.
     */
    public function identifier(string $name): string
    {
        if (preg_match(self::IDENTIFIER_PATTERN, $name) !== 1) {
            throw new UnexpectedValueException(sprintf('"%s" is not a valid PHP identifier.', $name));
        }

        return $name;
    }

    /**
     * @return list<string>
     */
    private function words(string $name): array
    {
        preg_match_all(self::WORD_PATTERN, $name, $matches);

        return $matches[0];
    }

    private function capitalize(string $word): string
    {
        return ucfirst(strtolower($word));
    }
}
