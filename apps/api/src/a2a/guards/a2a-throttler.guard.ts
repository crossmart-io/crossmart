import { type ExecutionContext, Injectable } from '@nestjs/common';
import { AskThrottlerGuard } from '../../ask/guards/ask-throttler.guard.js';
import { A2aMethod } from '../enums/a2a-method.enum.js';

const METHOD_FIELD = 'method';

/** Whether the JSON-RPC call asks a question, which costs an answer. */
function asksQuestion(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    METHOD_FIELD in body &&
    body[METHOD_FIELD] === A2aMethod.SendMessage
  );
}

/**
 * Ask's question limits for A2A `SendMessage`, the same as `POST /api/v1/ask`, so asking over
 * A2A gives no more room. Reading tasks is limited by the lighter polling guard only.
 */
@Injectable()
export class A2aQuestionThrottlerGuard extends AskThrottlerGuard {
  override canActivate(context: ExecutionContext): Promise<boolean> {
    const { body } = context.switchToHttp().getRequest<{ body: unknown }>();
    return asksQuestion(body) ? super.canActivate(context) : Promise.resolve(true);
  }
}
