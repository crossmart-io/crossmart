import { Injectable } from '@nestjs/common';

/**
 * The turns this instance runs, so a stop request (or the person closing the stream) aborts the
 * model call at once. A stop sent to another instance is stored on the turn and seen at the
 * loop's next step.
 */
@Injectable()
export class AgentWorkerCancellation {
  private readonly running = new Map<string, AbortController>();

  start(turnId: string): AbortSignal {
    const controller = new AbortController();
    this.running.set(turnId, controller);
    return controller.signal;
  }

  /** True when the turn runs on this instance and was aborted now. */
  abort(turnId: string): boolean {
    const controller = this.running.get(turnId);
    controller?.abort();
    return controller !== undefined;
  }

  end(turnId: string): void {
    this.running.delete(turnId);
  }
}
