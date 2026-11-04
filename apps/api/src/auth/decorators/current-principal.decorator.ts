import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest, Principal } from '../entities/principal.js';

/** The authenticated caller of the current request. */
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    const { principal } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!principal) {
      throw new UnauthorizedException();
    }
    return principal;
  },
);
