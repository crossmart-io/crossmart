<?php

declare(strict_types=1);

namespace Crossmart\Config;

use Crossmart\Http\Header;

/**
 * How the client authenticates.
 */
enum CredentialKind: string
{
    /** A workspace API key, created in Settings → API keys. Sent as `x-api-key`. */
    case ApiKey = 'api_key';

    /** An OAuth access token issued to an agent. Sent as `Authorization: Bearer`. */
    case AccessToken = 'access_token';

    public function header(): Header
    {
        return match ($this) {
            self::ApiKey => Header::ApiKey,
            self::AccessToken => Header::Authorization,
        };
    }
}
