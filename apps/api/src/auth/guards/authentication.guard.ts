import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_KEY_HEADER } from '@crossmart/common';
import { ApiKeysService } from '@crossmart/core';
import { IS_PUBLIC_METADATA_KEY } from '../auth.constants.js';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { AuthenticatedRequest, Principal } from '../entities/principal.js';
import { AuthService } from '../services/auth.service.js';

/** Global guard: every route needs an API key or a session cookie unless it is `@Public()`. */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = await this.resolvePrincipal(request);
    if (!principal) {
      throw new UnauthorizedException();
    }
    request.principal = principal;
    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  /** A presented API key wins; an invalid key is rejected rather than falling back to cookies. */
  private async resolvePrincipal(request: AuthenticatedRequest): Promise<Principal | null> {
    const apiKey = request.header(API_KEY_HEADER);
    if (apiKey !== undefined) {
      const identity = await this.apiKeys.authenticate(apiKey);
      return identity ? { kind: PrincipalKind.ApiKey, ...identity } : null;
    }
    return this.authService.findUserBySession(request.headers);
  }
}
