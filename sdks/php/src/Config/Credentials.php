<?php

declare(strict_types=1);

namespace Crossmart\Config;

use SensitiveParameter;

/**
 * The secret the client authenticates with. It never appears in `var_dump()` or `print_r()`.
 */
final class Credentials
{
    private const REDACTED = '***';

    public function __construct(
        public readonly CredentialKind $kind,
        #[SensitiveParameter]
        private readonly string $secret,
    ) {
    }

    public function headerValue(): string
    {
        return match ($this->kind) {
            CredentialKind::ApiKey => $this->secret,
            CredentialKind::AccessToken => Defaults::BEARER_SCHEME . $this->secret,
        };
    }

    /**
     * @return array<string, string>
     */
    public function __debugInfo(): array
    {
        return ['kind' => $this->kind->value, 'secret' => self::REDACTED];
    }
}
