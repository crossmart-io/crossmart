<?php

declare(strict_types=1);

namespace Crossmart\Tests;

use Crossmart\Config\EnvironmentVariable;
use Crossmart\Crossmart;
use Crossmart\Exception\ConfigurationException;

final class AuthenticationTest extends TestCase
{
    private const ACCESS_TOKEN = 'agent-access-token';

    public function testSendsAnApiKeyInTheXApiKeyHeader(): void
    {
        $this->respond(body: self::fixture('WorkspaceDto'));

        $this->client()->workspaces->get();

        $request = $this->lastRequest();
        self::assertSame(self::API_KEY, $request->getHeaderLine('x-api-key'));
        self::assertFalse($request->hasHeader('authorization'));
        self::assertSame('crossmart-php/' . Crossmart::VERSION, $request->getHeaderLine('user-agent'));
        self::assertSame(self::BASE_URL . self::WORKSPACE_PATH, (string) $request->getUri());
    }

    public function testSendsAnAccessTokenAsABearerToken(): void
    {
        $this->respond(body: self::fixture('WorkspaceDto'));

        $this->client(apiKey: null, accessToken: self::ACCESS_TOKEN)->workspaces->get();

        self::assertSame('Bearer ' . self::ACCESS_TOKEN, $this->lastRequest()->getHeaderLine('authorization'));
        self::assertFalse($this->lastRequest()->hasHeader('x-api-key'));
    }

    public function testReadsCredentialsAndSettingsFromTheEnvironment(): void
    {
        $this->setEnvironment(EnvironmentVariable::ApiKey, self::API_KEY);
        $this->setEnvironment(EnvironmentVariable::BaseUrl, self::BASE_URL);
        $this->setEnvironment(EnvironmentVariable::WorkspaceId, self::WORKSPACE_ID);
        $this->respond(body: self::fixture('WorkspaceDto'));

        $this->client(apiKey: null, baseUrl: null, workspaceId: null)->workspaces->get();

        self::assertSame(self::API_KEY, $this->lastRequest()->getHeaderLine('x-api-key'));
        self::assertSame(self::WORKSPACE_PATH, $this->lastPath());
    }

    public function testDefaultsToTheHostedApi(): void
    {
        $this->respond(body: self::fixture('WorkspaceDto'));

        $this->client(baseUrl: null)->workspaces->get();

        self::assertSame('api.crossmart.io', $this->lastRequest()->getUri()->getHost());
    }

    public function testAcceptsABaseUrlThatIncludesTheApiPrefix(): void
    {
        $this->respond(body: self::fixture('WorkspaceDto'));

        $this->client(baseUrl: self::BASE_URL . '/api/v1/')->workspaces->get();

        self::assertSame(self::WORKSPACE_PATH, $this->lastPath());
    }

    public function testRefusesToStartWithoutCredentials(): void
    {
        $this->expectException(ConfigurationException::class);
        $this->expectExceptionMessage('apiKey or accessToken');

        $this->client(apiKey: null);
    }

    public function testRefusesBothKindsOfCredentials(): void
    {
        $this->expectException(ConfigurationException::class);
        $this->expectExceptionMessage('not both');

        $this->client(accessToken: self::ACCESS_TOKEN);
    }

    public function testArgumentsWinOverTheEnvironment(): void
    {
        $this->setEnvironment(EnvironmentVariable::ApiKey, 'from-environment');
        $this->respond(body: self::fixture('WorkspaceDto'));

        $this->client(apiKey: null, accessToken: self::ACCESS_TOKEN)->workspaces->get();

        self::assertTrue($this->lastRequest()->hasHeader('authorization'));
    }

    public function testKeepsTheSecretOutOfDumps(): void
    {
        $dump = print_r($this->client(), true);

        self::assertStringNotContainsString(self::API_KEY, $dump);
    }

    public function testLooksUpTheApiKeysWorkspaceOnce(): void
    {
        $this->respond(body: [...self::fixture('CurrentApiKeyDto'), 'workspaceId' => self::WORKSPACE_ID]);
        $this->respond(body: self::fixture('WorkspaceDto'));
        $this->respond(body: self::fixture('WorkspaceDto'));
        $client = $this->client(workspaceId: null);

        $client->workspaces->get();
        $client->workspaces->get();

        self::assertSame(self::WORKSPACE_ID, $client->workspaceId());
        $paths = array_map(static fn ($request): string => $request->getUri()->getPath(), $this->http->getRequests());
        self::assertSame(['/api/v1/api-key', self::WORKSPACE_PATH, self::WORKSPACE_PATH], $paths);
    }

    public function testNeedsAWorkspaceIdWithAnAccessToken(): void
    {
        $client = $this->client(apiKey: null, accessToken: self::ACCESS_TOKEN, workspaceId: null);

        $this->expectException(ConfigurationException::class);
        $this->expectExceptionMessage('workspaceId');

        $client->workspaces->get();
    }
}
