import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Actor } from '@crossmart/core';
import type { AuthenticatedRequest } from '../entities/principal.js';
import { toActor } from '../principal.utils.js';

/** The caller of the current request, as the activity log records it. */
export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor => {
    const { principal } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!principal) {
      throw new UnauthorizedException();
    }
    return toActor(principal);
  },
);
