<?php

declare(strict_types=1);

namespace Crossmart\Http;

use Crossmart\Config\ClientOptions;
use Crossmart\Config\Defaults;
use Crossmart\Crossmart;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\StreamFactoryInterface;

/**
 * Turns an {@see ApiRequest} into a PSR-7 request with the URL, credentials and JSON body.
 */
final class RequestBuilder
{
    private const PLACEHOLDER_FORMAT = '{%s}';
    private const QUERY_SEPARATOR = '?';

    public function __construct(
        private readonly ClientOptions $options,
        private readonly RequestFactoryInterface $requestFactory,
        private readonly StreamFactoryInterface $streamFactory,
    ) {
    }

    public function build(ApiRequest $apiRequest): RequestInterface
    {
        $request = $this->requestFactory
            ->createRequest($apiRequest->method->value, $this->url($apiRequest))
            ->withHeader(Header::Accept->value, Defaults::JSON_MEDIA_TYPE)
            ->withHeader(Header::UserAgent->value, Defaults::USER_AGENT_PREFIX . Crossmart::VERSION)
            ->withHeader($this->options->credentials->kind->header()->value, $this->options->credentials->headerValue());
        if ($apiRequest->body === null) {
            return $request;
        }

        return $request
            ->withHeader(Header::ContentType->value, Defaults::JSON_MEDIA_TYPE)
            ->withBody($this->streamFactory->createStream(json_encode($apiRequest->body, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION)));
    }

    private function url(ApiRequest $apiRequest): string
    {
        $placeholders = [];
        foreach ($apiRequest->pathParameters as $name => $value) {
            $placeholders[sprintf(self::PLACEHOLDER_FORMAT, $name)] = rawurlencode($value);
        }
        $url = $this->options->baseUrl . strtr($apiRequest->pathTemplate, $placeholders);
        $query = QueryString::encode($apiRequest->query);

        return $query === '' ? $url : $url . self::QUERY_SEPARATOR . $query;
    }
}
