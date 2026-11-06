<?php

declare(strict_types=1);

namespace Crossmart\Config;

/**
 * Environment variables read when the matching argument is not given.
 */
enum EnvironmentVariable: string
{
    case ApiKey = 'CROSSMART_API_KEY';
    case AccessToken = 'CROSSMART_ACCESS_TOKEN';
    case BaseUrl = 'CROSSMART_BASE_URL';
    case WorkspaceId = 'CROSSMART_WORKSPACE_ID';

    /**
     * The variable's value from `$_ENV`, `$_SERVER` or `getenv()`, or null when it is unset or empty.
     */
    public function read(): ?string
    {
        $value = $_ENV[$this->value] ?? $_SERVER[$this->value] ?? getenv($this->value);

        return is_string($value) && $value !== '' ? $value : null;
    }
}
