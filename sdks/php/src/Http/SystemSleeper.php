<?php

declare(strict_types=1);

namespace Crossmart\Http;

final class SystemSleeper implements SleeperInterface
{
    private const MICROSECONDS_PER_SECOND = 1_000_000;

    public function sleep(float $seconds): void
    {
        if ($seconds > 0) {
            usleep((int) round($seconds * self::MICROSECONDS_PER_SECOND));
        }
    }
}
