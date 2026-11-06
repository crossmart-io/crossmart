<?php

declare(strict_types=1);

namespace Crossmart\Tests;

use Crossmart\Enum\EntitlementErrorCode;
use Crossmart\Exception\ApiException;
use Crossmart\Exception\AuthenticationException;
use Crossmart\Exception\BadRequestException;
use Crossmart\Exception\ConflictException;
use Crossmart\Exception\ConnectionException;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Exception\InvalidPayloadException;
use Crossmart\Exception\NotFoundException;
use Crossmart\Exception\PermissionDeniedException;
use Crossmart\Exception\PlanLimitException;
use Crossmart\Exception\RateLimitException;
use Crossmart\Exception\ServerException;
use Crossmart\Tests\Support\NetworkFailure;
use Nyholm\Psr7\Request;
use PHPUnit\Framework\Attributes\DataProvider;

final class ErrorsTest extends TestCase
{
    /**
     * @return iterable<string, array{int, class-string<ApiException>}>
     */
    public static function statuses(): iterable
    {
        yield 'bad request' => [400, BadRequestException::class];
        yield 'unauthorized' => [401, AuthenticationException::class];
        yield 'payment required' => [402, PlanLimitException::class];
        yield 'forbidden' => [403, PermissionDeniedException::class];
        yield 'not found' => [404, NotFoundException::class];
        yield 'conflict' => [409, ConflictException::class];
        yield 'too many requests' => [429, RateLimitException::class];
        yield 'server error' => [500, ServerException::class];
        yield 'other client error' => [422, ApiException::class];
    }

    /**
     * @param class-string<ApiException> $expected
     */
    #[DataProvider('statuses')]
    public function testMapsErrorStatusesToExceptions(int $status, string $expected): void
    {
        $this->respond($status, ['statusCode' => $status, 'message' => 'Nope', 'error' => 'Error']);

        $exception = $this->catchException(fn () => $this->client(maxRetries: 0)->products->get(self::PRODUCT_ID));

        self::assertSame($expected, $exception::class);
        self::assertInstanceOf(ApiException::class, $exception);
        self::assertSame($status, $exception->getStatus());
        self::assertSame('Nope', $exception->getApiMessage());
        self::assertSame('Error', $exception->getReasonPhrase());
    }

    public function testJoinsValidationMessages(): void
    {
        $this->respond(400, ['statusCode' => 400, 'message' => ['title must be a string', 'variants must not be empty'], 'error' => 'Bad Request']);

        $exception = $this->catchException(fn () => $this->client()->products->create(['title' => 'Mug', 'variants' => []]));

        self::assertInstanceOf(BadRequestException::class, $exception);
        self::assertSame('title must be a string; variants must not be empty', $exception->getApiMessage());
        self::assertSame('400 title must be a string; variants must not be empty', $exception->getMessage());
    }

    public function testExposesPlanLimitDetails(): void
    {
        $this->respond(402, [
            'statusCode' => 402,
            'message' => 'Your plan allows 100 active listings.',
            'code' => EntitlementErrorCode::PlanLimitReached->value,
            'feature' => 'active_listings',
            'plan' => 'starter',
            'limit' => 100,
            'usage' => 100,
        ]);

        $exception = $this->catchException(fn () => $this->client()->listings->publish(self::PRODUCT_ID, self::STORE_ID));

        self::assertInstanceOf(PlanLimitException::class, $exception);
        self::assertSame(EntitlementErrorCode::PlanLimitReached->value, $exception->getErrorCode());
        self::assertSame('active_listings', $exception->getFeature());
        self::assertSame('starter', $exception->getPlan());
        self::assertSame(100, $exception->getLimit());
        self::assertSame(100, $exception->getUsage());
    }

    public function testUsesTheBodyTextWhenItIsNotJson(): void
    {
        $this->respondWithText(404, 'Gateway says no');

        $exception = $this->catchException(fn () => $this->client()->products->get(self::PRODUCT_ID));

        self::assertInstanceOf(NotFoundException::class, $exception);
        self::assertSame('Gateway says no', $exception->getApiMessage());
        self::assertNull($exception->getBody());
    }

    public function testFallsBackToTheReasonPhrase(): void
    {
        $this->respondWithText(404, '');

        $exception = $this->catchException(fn () => $this->client()->products->get(self::PRODUCT_ID));

        self::assertInstanceOf(ApiException::class, $exception);
        self::assertSame('Not Found', $exception->getApiMessage());
    }

    public function testWrapsConnectionFailures(): void
    {
        $this->http->addException(new NetworkFailure(new Request('GET', self::BASE_URL)));

        $exception = $this->catchException(fn () => $this->client(maxRetries: 0)->products->get(self::PRODUCT_ID));

        self::assertInstanceOf(ConnectionException::class, $exception);
        self::assertSame('Connection refused', $exception->getMessage());
    }

    public function testRejectsAResponseThatDoesNotMatchTheSchema(): void
    {
        $this->respond(body: ['id' => 42]);

        $exception = $this->catchException(fn () => $this->client()->products->get(self::PRODUCT_ID));

        self::assertInstanceOf(InvalidPayloadException::class, $exception);
        self::assertSame('ProductDto.id should be a string, got int.', $exception->getMessage());
    }

    private function catchException(callable $call): CrossmartExceptionInterface
    {
        try {
            $call();
        } catch (CrossmartExceptionInterface $exception) {
            return $exception;
        }
        self::fail('No exception was thrown.');
    }
}
