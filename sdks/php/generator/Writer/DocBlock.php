<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

/**
 * Renders PHPDoc comments.
 */
final class DocBlock
{
    private const COMMENT_END = '*/';
    private const ESCAPED_COMMENT_END = '*\/';

    /**
     * @param list<string|null> $paragraphs Text paragraphs; nulls are skipped.
     * @param list<string> $tags Tag lines such as `@param string $id`.
     *
     * @return list<string>
     */
    public function render(array $paragraphs, array $tags, string $indent = ''): array
    {
        $sections = array_map($this->lines(...), array_values(array_filter($paragraphs, static fn (?string $text): bool => $text !== null && trim($text) !== '')));
        if ($tags !== []) {
            $sections[] = array_map($this->escape(...), $tags);
        }
        if ($sections === []) {
            return [];
        }

        $body = [];
        foreach ($sections as $index => $section) {
            if ($index > 0) {
                $body[] = '';
            }
            array_push($body, ...$section);
        }

        return [
            $indent . '/**',
            ...array_map(static fn (string $line): string => rtrim($indent . ' * ' . $line), $body),
            $indent . ' */',
        ];
    }

    /**
     * Collapses a description to one line, for a tag.
     */
    public function inline(?string $text): string
    {
        return $text === null ? '' : $this->escape(trim((string) preg_replace('/\s+/', ' ', $text)));
    }

    /**
     * @return list<string>
     */
    private function lines(?string $text): array
    {
        return array_map($this->escape(...), explode("\n", trim((string) $text)));
    }

    private function escape(string $text): string
    {
        return str_replace(self::COMMENT_END, self::ESCAPED_COMMENT_END, $text);
    }
}
