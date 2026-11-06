import type { ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMITED_MESSAGE, RATE_LIMIT_MESSAGE_METADATA_KEY } from './throttling.constants.js';

/** The message a `429` from this route or controller carries, instead of the generic one. */
export const RateLimitMessage = (message: string): MethodDecorator & ClassDecorator =>
  SetMetadata(RATE_LIMIT_MESSAGE_METADATA_KEY, message);

const reflector = new Reflector();

/** The `429` message for the route being handled: its `@RateLimitMessage()`, or the generic one. */
export function rateLimitMessageFor(context: ExecutionContext): string {
  return (
    reflector.getAllAndOverride<string | undefined>(RATE_LIMIT_MESSAGE_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? RATE_LIMITED_MESSAGE
  );
}
