<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ProposeAgentChangeDto implements JsonSerializable
{
    /**
     * @param string $tool An MCP write tool, as the MCP server lists it
     * @param array<string, mixed> $input The tool's input, as its MCP schema describes it
     */
    public function __construct(
        public readonly string $tool,
        public readonly array $input,
    ) {
    }

    /**
     * Builds the model from the API's JSON shape.
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $payload = new Payload($data, self::class);

        return new self(
            tool: $payload->string('tool'),
            input: $payload->object('input'),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'tool' => $this->tool,
            'input' => $this->input,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
