<?php

declare(strict_types=1);

namespace Crossmart\Config;

use Crossmart\Exception\ConfigurationException;
use SensitiveParameter;

/**
 * The client's settings, from its arguments and then from environment variables.
 */
final class ClientOptions
{
    private const MISSING_CREDENTIALS_MESSAGE = 'Pass apiKey or accessToken, or set the CROSSMART_API_KEY or CROSSMART_ACCESS_TOKEN environment variable.';
    private const CONFLICTING_CREDENTIALS_MESSAGE = 'Pass either apiKey or accessToken, not both.';
    private const TRAILING_SLASH = '/';

    private function __construct(
        public readonly Credentials $credentials,
        public readonly string $baseUrl,
        public readonly ?string $workspaceId,
    ) {
    }

    /**
     * Fills each missing argument from its environment variable, then validates the result.
     *
     * @throws ConfigurationException When there is no credential, or two.
     */
    public static function resolve(
        #[SensitiveParameter]
        ?string $apiKey,
        #[SensitiveParameter]
        ?string $accessToken,
        ?string $baseUrl,
        ?string $workspaceId,
    ): self {
        return new self(
            self::credentials($apiKey, $accessToken),
            self::normalizeBaseUrl($baseUrl ?? EnvironmentVariable::BaseUrl->read() ?? Defaults::BASE_URL),
            $workspaceId ?? EnvironmentVariable::WorkspaceId->read(),
        );
    }

    /**
     * Arguments win over environment variables. Exactly one kind of credential must remain.
     */
    private static function credentials(
        #[SensitiveParameter]
        ?string $apiKey,
        #[SensitiveParameter]
        ?string $accessToken,
    ): Credentials {
        if (($apiKey ?? '') === '' && ($accessToken ?? '') === '') {
            $apiKey = EnvironmentVariable::ApiKey->read();
            $accessToken = EnvironmentVariable::AccessToken->read();
        }
        if (($apiKey ?? '') !== '' && ($accessToken ?? '') !== '') {
            throw new ConfigurationException(self::CONFLICTING_CREDENTIALS_MESSAGE);
        }

        return match (true) {
            $apiKey !== null && $apiKey !== '' => new Credentials(CredentialKind::ApiKey, $apiKey),
            $accessToken !== null && $accessToken !== '' => new Credentials(CredentialKind::AccessToken, $accessToken),
            default => throw new ConfigurationException(self::MISSING_CREDENTIALS_MESSAGE),
        };
    }

    /**
     * Accepts the API's origin with or without the `/api/v1` prefix.
     */
    private static function normalizeBaseUrl(string $baseUrl): string
    {
        $trimmed = rtrim($baseUrl, self::TRAILING_SLASH);

        return str_ends_with($trimmed, Defaults::API_PATH_PREFIX)
            ? substr($trimmed, 0, -strlen(Defaults::API_PATH_PREFIX))
            : $trimmed;
    }
}
