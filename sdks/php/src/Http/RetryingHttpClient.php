<?php

declare(strict_types=1);

namespace Crossmart\Http;

use Psr\Http\Client\ClientInterface;
use Psr\Http\Client\NetworkExceptionInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * A PSR-18 client that retries idempotent requests according to a {@see RetryPolicy}.
 */
final class RetryingHttpClient implements ClientInterface
{
    public function __construct(
        private readonly ClientInterface $client,
        private readonly RetryPolicy $policy,
        private readonly SleeperInterface $sleeper = new SystemSleeper(),
    ) {
    }

    public function sendRequest(RequestInterface $request): ResponseInterface
    {
        $attempt = 1;
        while (true) {
            try {
                $response = $this->client->sendRequest($this->rewound($request));
            } catch (NetworkExceptionInterface $exception) {
                if (!$this->policy->allowsRetry($request->getMethod(), $attempt)) {
                    throw $exception;
                }
                $this->sleeper->sleep($this->policy->delay($attempt));
                ++$attempt;

                continue;
            }
            if (!$this->policy->shouldRetryStatus($request->getMethod(), $response->getStatusCode(), $attempt)) {
                return $response;
            }
            $this->sleeper->sleep($this->policy->delay($attempt, $response->getHeaderLine(Header::RetryAfter->value)));
            ++$attempt;
        }
    }

    /**
     * The request with its body at the start, so a retry sends the whole body again.
     */
    private function rewound(RequestInterface $request): RequestInterface
    {
        $body = $request->getBody();
        if ($body->isSeekable()) {
            $body->rewind();
        }

        return $request;
    }
}
