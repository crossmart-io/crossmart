<?php

declare(strict_types=1);

namespace Crossmart\Generator;

/**
 * Where the generated code goes and what it depends on in the hand-written SDK.
 */
final class GeneratorConfig
{
    public const MODEL_NAMESPACE = 'Crossmart\\Model';
    public const ENUM_NAMESPACE = 'Crossmart\\Enum';
    public const API_NAMESPACE = 'Crossmart\\Api';

    /** Each namespace and the directory under src/ it is generated into. */
    public const OUTPUT_DIRECTORIES = [
        self::API_NAMESPACE => 'Api',
        self::ENUM_NAMESPACE => 'Enum',
        self::MODEL_NAMESPACE => 'Model',
    ];

    public const DATE_TIME_CLASS = 'DateTimeImmutable';
    public const JSON_SERIALIZABLE_CLASS = 'JsonSerializable';
    public const PAYLOAD_CLASS = 'Crossmart\\Serialization\\Payload';
    public const UNDEFINED_CLASS = 'Crossmart\\Serialization\\Undefined';
    public const TRANSPORT_CLASS = 'Crossmart\\Http\\TransportInterface';
    public const REQUEST_CLASS = 'Crossmart\\Http\\ApiRequest';
    public const HTTP_METHOD_CLASS = 'Crossmart\\Http\\HttpMethod';
    public const API_EXCEPTION_CLASS = 'Crossmart\\Exception\\CrossmartExceptionInterface';

    public const API_CLASS_SUFFIX = 'Api';
    public const API_CLIENTS_CLASS = 'ApiClients';

    public const FILE_HEADER = <<<'PHP'
        <?php

        declare(strict_types=1);

        // Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.
        PHP;
}
