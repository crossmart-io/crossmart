<?php

declare(strict_types=1);

namespace Crossmart\Tests\Webhook;

use Crossmart\Exception\WebhookSignatureException;
use Crossmart\Webhook\WebhookEventType;
use Crossmart\Webhook\WebhookHeader;
use Crossmart\Webhook\WebhookSignature;
use Crossmart\Webhook\WebhookSignatureFailure;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class WebhookSignatureTest extends TestCase
{
    private const SECRET = 'whsec_test_secret';
    private const OLD_SECRET = 'whsec_old_secret';
    private const NOW = 1_793_966_400;
    private const PAYLOAD = '{"id":"0f8b2a52-5d4e-4c3a-9b1e-7c6d5e4f3a2b","type":"order.created",'
        . '"createdAt":"2026-11-06T12:00:00.000Z","workspaceId":"6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d",'
        . '"apiVersion":"v1","data":{"orderId":"ord_1","total":"19.99"}}';

    public function testReturnsTheEventWhenTheSignatureMatches(): void
    {
        $header = self::header([self::sign(self::PAYLOAD)]);

        $event = WebhookSignature::verify(self::PAYLOAD, $header, self::SECRET, now: self::NOW);

        self::assertSame('0f8b2a52-5d4e-4c3a-9b1e-7c6d5e4f3a2b', $event->id);
        self::assertSame(WebhookEventType::OrderCreated, $event->eventType());
        self::assertSame('v1', $event->apiVersion);
        self::assertSame(['orderId' => 'ord_1', 'total' => '19.99'], $event->data);
    }

    /**
     * @return iterable<string, array{list<string>}>
     */
    public static function rotatedSignatures(): iterable
    {
        yield 'old secret first' => [[self::sign(self::PAYLOAD, self::OLD_SECRET), self::sign(self::PAYLOAD)]];
        yield 'new secret first' => [[self::sign(self::PAYLOAD), self::sign(self::PAYLOAD, self::OLD_SECRET)]];
    }

    /**
     * @param list<string> $signatures
     */
    #[DataProvider('rotatedSignatures')]
    public function testAcceptsEitherSignatureDuringARotation(array $signatures): void
    {
        $event = WebhookSignature::verify(self::PAYLOAD, self::header($signatures), self::SECRET, now: self::NOW);

        self::assertSame('order.created', $event->type);
    }

    public function testIgnoresUnknownSchemesAndWhitespace(): void
    {
        $header = sprintf('t=%d, v0=abc, v1=%s', self::NOW, self::sign(self::PAYLOAD));

        $event = WebhookSignature::verify(self::PAYLOAD, $header, self::SECRET, now: self::NOW);

        self::assertSame('order.created', $event->type);
    }

    public function testReturnsNoEnumForAnUnknownEventType(): void
    {
        $payload = str_replace('order.created', 'order.refunded', self::PAYLOAD);

        $event = WebhookSignature::verify($payload, self::header([self::sign($payload)]), self::SECRET, now: self::NOW);

        self::assertSame('order.refunded', $event->type);
        self::assertNull($event->eventType());
    }

    public function testRejectsATamperedBody(): void
    {
        $tampered = str_replace('19.99', '0.01', self::PAYLOAD);
        $header = self::header([self::sign(self::PAYLOAD)]);

        self::assertFailure(WebhookSignatureFailure::SignatureMismatch, $tampered, $header);
    }

    public function testRejectsAnotherSecretWithoutRevealingTheSecret(): void
    {
        $exception = self::catchFailure(self::PAYLOAD, self::header([self::sign(self::PAYLOAD, self::OLD_SECRET)]));

        self::assertSame(WebhookSignatureFailure::SignatureMismatch, $exception->getReason());
        self::assertStringNotContainsString(self::SECRET, $exception->getMessage());
    }

    public function testRejectsAHeaderTimestampThatWasNotSigned(): void
    {
        $header = self::header([self::sign(self::PAYLOAD)], self::NOW + 1);

        self::assertFailure(WebhookSignatureFailure::SignatureMismatch, self::PAYLOAD, $header);
    }

    /**
     * @return iterable<string, array{int}>
     */
    public static function timestampsBeyondTolerance(): iterable
    {
        yield 'expired' => [self::NOW - 301];
        yield 'in the future' => [self::NOW + 301];
    }

    #[DataProvider('timestampsBeyondTolerance')]
    public function testRejectsATimestampBeyondTheTolerance(int $timestamp): void
    {
        $header = self::header([self::sign(self::PAYLOAD, self::SECRET, $timestamp)], $timestamp);

        self::assertFailure(WebhookSignatureFailure::TimestampOutsideTolerance, self::PAYLOAD, $header);
    }

    public function testAcceptsATimestampAtTheEdgeOfTheTolerance(): void
    {
        $timestamp = self::NOW - 300;
        $header = self::header([self::sign(self::PAYLOAD, self::SECRET, $timestamp)], $timestamp);

        $event = WebhookSignature::verify(self::PAYLOAD, $header, self::SECRET, now: self::NOW);

        self::assertSame('order.created', $event->type);
    }

    public function testHonoursACustomTolerance(): void
    {
        $timestamp = self::NOW - 60;
        $header = self::header([self::sign(self::PAYLOAD, self::SECRET, $timestamp)], $timestamp);

        $exception = self::catchFailure(self::PAYLOAD, $header, toleranceSeconds: 30);

        self::assertSame(WebhookSignatureFailure::TimestampOutsideTolerance, $exception->getReason());
    }

    /**
     * @return iterable<string, array{string|null, WebhookSignatureFailure}>
     */
    public static function malformedHeaders(): iterable
    {
        yield 'null' => [null, WebhookSignatureFailure::MissingHeader];
        yield 'empty' => ['', WebhookSignatureFailure::MissingHeader];
        yield 'no key-value pairs' => ['garbage', WebhookSignatureFailure::MalformedHeader];
        yield 'empty key' => ['=abc', WebhookSignatureFailure::MalformedHeader];
        yield 'no timestamp' => ['v1=abc', WebhookSignatureFailure::MissingTimestamp];
        yield 'decimal timestamp' => ['t=12.5,v1=abc', WebhookSignatureFailure::InvalidTimestamp];
        yield 'text timestamp' => ['t=abc,v1=abc', WebhookSignatureFailure::InvalidTimestamp];
        yield 'negative timestamp' => ['t=-1,v1=abc', WebhookSignatureFailure::InvalidTimestamp];
        yield 'no signature' => [sprintf('t=%d', self::NOW), WebhookSignatureFailure::MissingSignature];
        yield 'only unknown schemes' => [sprintf('t=%d,v0=abc', self::NOW), WebhookSignatureFailure::MissingSignature];
        yield 'not hex' => [sprintf('t=%d,v1=not-hex', self::NOW), WebhookSignatureFailure::SignatureMismatch];
    }

    #[DataProvider('malformedHeaders')]
    public function testRejectsMalformedHeaders(?string $header, WebhookSignatureFailure $reason): void
    {
        self::assertFailure($reason, self::PAYLOAD, $header);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function invalidEvents(): iterable
    {
        yield 'not JSON' => ['not json'];
        yield 'a JSON list' => ['[1,2]'];
        yield 'a missing field' => ['{"id":"evt_1","data":{}}'];
        yield 'data is not an object' => [str_replace('{"orderId":"ord_1","total":"19.99"}', '"text"', self::PAYLOAD)];
    }

    #[DataProvider('invalidEvents')]
    public function testRejectsASignedPayloadThatIsNotAnEvent(string $payload): void
    {
        self::assertFailure(WebhookSignatureFailure::InvalidPayload, $payload, self::header([self::sign($payload)]));
    }

    public function testMapsHeadersToTheirServerKeys(): void
    {
        self::assertSame('HTTP_CROSSMART_SIGNATURE', WebhookHeader::Signature->serverKey());
    }

    private static function sign(string $payload, string $secret = self::SECRET, int $timestamp = self::NOW): string
    {
        return hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    }

    /**
     * @param list<string> $signatures
     */
    private static function header(array $signatures, int $timestamp = self::NOW): string
    {
        $elements = ['t=' . $timestamp];
        foreach ($signatures as $signature) {
            $elements[] = 'v1=' . $signature;
        }

        return implode(',', $elements);
    }

    private static function assertFailure(WebhookSignatureFailure $reason, string $payload, ?string $header): void
    {
        self::assertSame($reason, self::catchFailure($payload, $header)->getReason());
    }

    private static function catchFailure(
        string $payload,
        ?string $header,
        int $toleranceSeconds = WebhookSignature::DEFAULT_TOLERANCE_SECONDS,
    ): WebhookSignatureException {
        try {
            WebhookSignature::verify($payload, $header, self::SECRET, $toleranceSeconds, self::NOW);
        } catch (WebhookSignatureException $exception) {
            return $exception;
        }
        self::fail('Expected a WebhookSignatureException');
    }
}
