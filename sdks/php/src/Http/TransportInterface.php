<?php

declare(strict_types=1);

namespace Crossmart\Http;

use Crossmart\Exception\CrossmartExceptionInterface;

/**
 * Sends API requests. The generated operation classes call it; tests can replace it.
 */
interface TransportInterface
{
    /**
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function send(ApiRequest $request): ApiResponse;
}
