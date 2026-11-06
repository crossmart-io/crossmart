<?php

declare(strict_types=1);

namespace Crossmart\Tests\Support;

use Crossmart\Http\SleeperInterface;

/**
 * Records the waits between retries instead of sleeping.
 */
final class RecordingSleeper implements SleeperInterface
{
    /** @var list<float> */
    public array $waits = [];

    public function sleep(float $seconds): void
    {
        $this->waits[] = $seconds;
    }
}
