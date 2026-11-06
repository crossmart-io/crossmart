<?php

declare(strict_types=1);

namespace Crossmart\Http;

/**
 * Waits between two attempts of a request. Tests replace it to run without waiting.
 */
interface SleeperInterface
{
    public function sleep(float $seconds): void;
}
