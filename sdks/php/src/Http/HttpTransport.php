<?php

declare(strict_types=1);

namespace Crossmart\Http;

use Crossmart\Exception\ApiExceptionFactory;
use Crossmart\Exception\ConnectionException;
use Psr\Http\Client\ClientExceptionInterface;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\ResponseInterface;

/**
 * Sends API requests through a PSR-18 client and turns error statuses into exceptions.
 */
final class HttpTransport implements TransportInterface
{
    public function __construct(
        private readonly ClientInterface $client,
        private readonly RequestBuilder $requestBuilder,
        private readonly ApiExceptionFactory $exceptionFactory = new ApiExceptionFactory(),
    ) {
    }

    public function send(ApiRequest $request): ApiResponse
    {
        $response = $this->sendHttpRequest($request);
        $content = (string) $response->getBody();
        if ($response->getStatusCode() >= HttpStatus::ERROR_THRESHOLD) {
            throw $this->exceptionFactory->create(
                $response->getStatusCode(),
                $content,
                $response->getReasonPhrase() === '' ? null : $response->getReasonPhrase(),
                $this->headers($response),
            );
        }

        return new ApiResponse($response->getStatusCode(), $content, $this->headers($response));
    }

    private function sendHttpRequest(ApiRequest $request): ResponseInterface
    {
        try {
            return $this->client->sendRequest($this->requestBuilder->build($request));
        } catch (ClientExceptionInterface $exception) {
            throw new ConnectionException($exception->getMessage(), 0, $exception);
        }
    }

    /**
     * @return array<string, list<string>>
     */
    private function headers(ResponseInterface $response): array
    {
        $headers = [];
        foreach ($response->getHeaders() as $name => $values) {
            $headers[strtolower((string) $name)] = array_values($values);
        }

        return $headers;
    }
}
