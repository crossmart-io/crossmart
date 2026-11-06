<?php

declare(strict_types=1);

namespace Crossmart\Exception;

use Crossmart\Webhook\WebhookSignatureFailure;
use Throwable;
use UnexpectedValueException;

/**
 * A webhook delivery failed verification. Answer it with a 400 and do not process it.
 */
final class WebhookSignatureException extends UnexpectedValueException implements CrossmartExceptionInterface
{
    public function __construct(
        private readonly WebhookSignatureFailure $reason,
        ?Throwable $previous = null,
    ) {
        parent::__construct($reason->message(), 0, $previous);
    }

    /** Why the delivery was rejected. */
    public function getReason(): WebhookSignatureFailure
    {
        return $this->reason;
    }
}
