<?php

declare(strict_types=1);

namespace Crossmart\Config;

/**
 * The client's defaults.
 */
final class Defaults
{
    /** The hosted API. The operations already carry the `/api/v1` prefix. */
    public const BASE_URL = 'https://api.crossmart.io';

    /** Stripped from a base URL that includes it, so both forms work. */
    public const API_PATH_PREFIX = '/api/v1';

    public const MAX_RETRIES = 2;
    public const INITIAL_BACKOFF_SECONDS = 0.5;
    public const MAX_BACKOFF_SECONDS = 8.0;

    /** A longer `Retry-After` is capped, so a misbehaving proxy cannot stall the caller for hours. */
    public const MAX_RETRY_AFTER_SECONDS = 60.0;
    public const BACKOFF_MULTIPLIER = 2.0;
    public const BACKOFF_JITTER_RATIO = 0.25;

    /** The largest page the API serves. Iterators ask for it, so they make as few requests as possible. */
    public const MAX_PAGE_SIZE = 100;

    public const USER_AGENT_PREFIX = 'crossmart-php/';
    public const BEARER_SCHEME = 'Bearer ';
    public const JSON_MEDIA_TYPE = 'application/json';
}
