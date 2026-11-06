<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AskAnswerDto;
use Crossmart\Model\AskQuestionDto;

/**
 * The operations tagged "Ask Crossmart".
 */
final class AskCrossmartApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Ask a question about Crossmart
     *
     * Answers from Crossmart’s public documentation and plan lineup only, citing the pages it used. When they do not answer the question, `outcome` is `unknown` and the answer points to the support address. It never sees or changes any account or workspace data. No credentials are needed: anonymous callers may ask 5 questions a minute and 50 a day per IP address; with an API key or session, 20 a minute and 500 a day. Answers 429 past those, and 503 when AI is not configured or the platform’s daily question budget is spent.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askControllerAskV1(
        AskQuestionDto $body,
    ): AskAnswerDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/ask',
            body: $body->toArray(),
        ));

        return AskAnswerDto::fromArray($response->object());
    }
}
