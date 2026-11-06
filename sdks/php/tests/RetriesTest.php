<?php

declare(strict_types=1);

namespace Crossmart\Tests;

use Crossmart\Config\Defaults;
use Crossmart\Exception\ConnectionException;
use Crossmart\Exception\NotFoundException;
use Crossmart\Exception\ServerException;
use Crossmart\Http\RetryPolicy;
use Crossmart\Tests\Support\NetworkFailure;
use Nyholm\Psr7\Request;

final class RetriesTest extends TestCase
{
    private const HTTP_DATE_FORMAT = 'D, d M Y H:i:s \G\M\T';

    public function testRetriesAGetAfterAServerError(): void
    {
        $this->respond(503);
        $this->respond(body: self::fixture('ProductDto'));

        $this->client()->products->get(self::PRODUCT_ID);

        self::assertSame(2, $this->requestCount());
        self::assertCount(1, $this->sleeper->waits);
    }

    public function testWaitsAsLongAsRetryAfterAsks(): void
    {
        $this->respond(429, headers: ['retry-after' => '3']);
        $this->respond(body: self::fixture('ProductDto'));

        $this->client()->products->get(self::PRODUCT_ID);

        self::assertSame([3.0], $this->sleeper->waits);
    }

    public function testReadsRetryAfterAsAnHttpDate(): void
    {
        $retryAt = gmdate(self::HTTP_DATE_FORMAT, time() + 10);
        $this->respond(503, headers: ['retry-after' => $retryAt]);
        $this->respond(body: self::fixture('ProductDto'));

        $this->client()->products->get(self::PRODUCT_ID);

        self::assertCount(1, $this->sleeper->waits);
        self::assertEqualsWithDelta(10.0, $this->sleeper->waits[0], 2.0);
    }

    public function testCapsALongRetryAfter(): void
    {
        $this->respond(503, headers: ['retry-after' => '3600']);
        $this->respond(body: self::fixture('ProductDto'));

        $this->client()->products->get(self::PRODUCT_ID);

        self::assertSame([Defaults::MAX_RETRY_AFTER_SECONDS], $this->sleeper->waits);
    }

    public function testThrowsOnceRetriesRunOut(): void
    {
        $this->respond(503);
        $this->respond(503);
        $this->respond(503);

        $this->expectException(ServerException::class);
        try {
            $this->client()->products->get(self::PRODUCT_ID);
        } finally {
            self::assertSame(3, $this->requestCount());
        }
    }

    public function testNeverRetriesAPost(): void
    {
        $this->respond(503);

        $this->expectException(ServerException::class);
        try {
            $this->client()->listings->publish(self::PRODUCT_ID, self::STORE_ID);
        } finally {
            self::assertSame(1, $this->requestCount());
        }
    }

    public function testRetriesAPutWithItsBody(): void
    {
        $this->respond(502);
        $this->respond(body: self::fixture('ProductDto'));

        $this->client()->products->update(self::PRODUCT_ID, ['title' => 'Mug', 'handle' => 'mug', 'variants' => []]);

        self::assertSame(2, $this->requestCount());
        self::assertSame(['title' => 'Mug', 'handle' => 'mug', 'variants' => []], $this->lastBody());
    }

    public function testDoesNotRetryAClientError(): void
    {
        $this->respond(404);

        $this->expectException(NotFoundException::class);
        try {
            $this->client()->products->get(self::PRODUCT_ID);
        } finally {
            self::assertSame(1, $this->requestCount());
        }
    }

    public function testRetriesARefusedConnection(): void
    {
        $this->http->addException(new NetworkFailure(new Request('GET', self::BASE_URL)));
        $this->respond(body: self::fixture('ProductDto'));

        $this->client()->products->get(self::PRODUCT_ID);

        self::assertSame(2, $this->requestCount());
    }

    public function testDoesNotRetryAPostWhoseConnectionFailed(): void
    {
        $this->http->addException(new NetworkFailure(new Request('POST', self::BASE_URL)));

        $this->expectException(ConnectionException::class);
        $this->client()->listings->publish(self::PRODUCT_ID, self::STORE_ID);
    }

    public function testCanBeTurnedOff(): void
    {
        $this->respond(503);

        $this->expectException(ServerException::class);
        try {
            $this->client(maxRetries: 0)->products->get(self::PRODUCT_ID);
        } finally {
            self::assertSame(1, $this->requestCount());
            self::assertSame([], $this->sleeper->waits);
        }
    }

    public function testBacksOffExponentiallyUpToACap(): void
    {
        $policy = new RetryPolicy(maxRetries: 10, initialBackoff: 1.0, maxBackoff: 4.0);

        $delays = array_map(static fn (int $attempt): float => $policy->delay($attempt), [1, 2, 3, 4]);

        foreach ([1.0, 2.0, 4.0, 4.0] as $index => $ceiling) {
            self::assertLessThanOrEqual($ceiling, $delays[$index]);
            self::assertGreaterThanOrEqual($ceiling * (1 - Defaults::BACKOFF_JITTER_RATIO), $delays[$index]);
        }
    }
}
