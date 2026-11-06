<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * `metadata_document`: Crossmart fetched the agent’s metadata from its HTTPS client id. `dynamic`: the agent registered itself, and its name and site are unverified.
 */
enum AgentClientRegistration: string
{
    case MetadataDocument = 'metadata_document';
    case Dynamic = 'dynamic';
}
