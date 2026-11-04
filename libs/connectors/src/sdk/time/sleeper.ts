import { Injectable } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';

/** Waits between retries. Injected so tests run without real delays. */
export abstract class Sleeper {
  abstract sleep(milliseconds: number): Promise<void>;
}

@Injectable()
export class TimerSleeper extends Sleeper {
  async sleep(milliseconds: number): Promise<void> {
    await delay(milliseconds);
  }
}

/** Records waits instead of waiting, for tests. */
export class RecordingSleeper extends Sleeper {
  readonly waits: number[] = [];

  sleep(milliseconds: number): Promise<void> {
    this.waits.push(milliseconds);
    return Promise.resolve();
  }
}
