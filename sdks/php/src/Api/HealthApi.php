<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;

/**
 * The operations tagged "Health".
 */
final class HealthApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Report API and database health
     *
     * @return array<string, mixed>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function healthControllerCheckV1(): array
    {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/health',
        ));

        return $response->object();
    }
}
