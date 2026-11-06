<?php

declare(strict_types=1);

namespace Crossmart\Tests;

use Crossmart\Config\EnvironmentVariable;
use Crossmart\Crossmart;
use Crossmart\Tests\Support\RecordingSleeper;
use Http\Mock\Client as MockClient;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7\Response;
use PHPUnit\Framework\TestCase as BaseTestCase;
use Psr\Http\Message\RequestInterface;

/**
 * Runs the client against a mock PSR-18 client that answers with queued responses.
 */
abstract class TestCase extends BaseTestCase
{
    protected const BASE_URL = 'https://api.test.crossmart.io';
    protected const API_KEY = 'cm_test_key';
    protected const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
    protected const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
    protected const STORE_ID = '33333333-3333-4333-8333-333333333333';
    protected const WORKSPACE_PATH = '/api/v1/workspaces/' . self::WORKSPACE_ID;

    private const FIXTURES_DIRECTORY = __DIR__ . '/Fixtures';
    private const JSON_CONTENT_TYPE = ['content-type' => 'application/json'];

    protected MockClient $http;
    protected RecordingSleeper $sleeper;

    protected function setUp(): void
    {
        $this->http = new MockClient(new Psr17Factory());
        $this->sleeper = new RecordingSleeper();
        foreach (EnvironmentVariable::cases() as $variable) {
            $this->unsetEnvironment($variable);
        }
    }

    protected function tearDown(): void
    {
        foreach (EnvironmentVariable::cases() as $variable) {
            $this->unsetEnvironment($variable);
        }
    }

    protected function client(
        ?string $apiKey = self::API_KEY,
        ?string $accessToken = null,
        ?string $baseUrl = self::BASE_URL,
        ?string $workspaceId = self::WORKSPACE_ID,
        int $maxRetries = 2,
    ): Crossmart {
        $factory = new Psr17Factory();

        return new Crossmart(
            apiKey: $apiKey,
            accessToken: $accessToken,
            baseUrl: $baseUrl,
            workspaceId: $workspaceId,
            maxRetries: $maxRetries,
            httpClient: $this->http,
            requestFactory: $factory,
            streamFactory: $factory,
            sleeper: $this->sleeper,
        );
    }

    /**
     * A sample response body built from the API's schemas by scripts/build-test-fixtures.php.
     *
     * @return array<string, mixed>
     */
    protected static function fixture(string $name): array
    {
        $decoded = json_decode((string) file_get_contents(self::FIXTURES_DIRECTORY . '/' . $name . '.json'), true, flags: JSON_THROW_ON_ERROR);
        self::assertIsArray($decoded);
        $fixture = [];
        foreach ($decoded as $key => $value) {
            $fixture[(string) $key] = $value;
        }

        return $fixture;
    }

    /**
     * @param list<array<string, mixed>> $items
     *
     * @return array<string, mixed>
     */
    protected static function page(array $items, ?string $nextCursor = null): array
    {
        return ['items' => $items, 'nextCursor' => $nextCursor, 'total' => count($items)];
    }

    /**
     * @param array<mixed>|null $body
     * @param array<string, string> $headers
     */
    protected function respond(int $status = 200, ?array $body = null, array $headers = []): void
    {
        $content = $body === null ? '' : json_encode($body, JSON_THROW_ON_ERROR);
        $this->http->addResponse(new Response($status, [...self::JSON_CONTENT_TYPE, ...$headers], $content));
    }

    protected function respondWithText(int $status, string $text): void
    {
        $this->http->addResponse(new Response($status, [], $text));
    }

    protected function lastRequest(): RequestInterface
    {
        $request = $this->http->getLastRequest();
        self::assertInstanceOf(RequestInterface::class, $request);

        return $request;
    }

    protected function lastPath(): string
    {
        return $this->lastRequest()->getUri()->getPath();
    }

    protected function lastQuery(): string
    {
        return $this->lastRequest()->getUri()->getQuery();
    }

    protected function lastBody(): mixed
    {
        $body = $this->lastRequest()->getBody();
        $body->rewind();

        return json_decode($body->getContents(), true, flags: JSON_THROW_ON_ERROR);
    }

    protected function requestCount(): int
    {
        return count($this->http->getRequests());
    }

    protected function setEnvironment(EnvironmentVariable $variable, string $value): void
    {
        putenv($variable->value . '=' . $value);
    }

    private function unsetEnvironment(EnvironmentVariable $variable): void
    {
        putenv($variable->value);
        unset($_ENV[$variable->value], $_SERVER[$variable->value]);
    }
}
