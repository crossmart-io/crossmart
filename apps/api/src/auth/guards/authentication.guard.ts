import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_KEY_HEADER } from '@crossmart/common';
import { ApiKeysService } from '@crossmart/core';
import { ALLOWS_ANONYMOUS_METADATA_KEY, IS_PUBLIC_METADATA_KEY } from '../auth.constants.js';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { AuthenticatedRequest, Principal } from '../entities/principal.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Global guard: every route needs an API key or a session cookie unless it is `@Public()`.
 * A route marked `@AllowAnonymous()` identifies callers who send credentials and lets the
 * others through anonymously; a wrong API key is still refused.
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly apiKeys: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.hasMetadata(context, IS_PUBLIC_METADATA_KEY)) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = await this.resolvePrincipal(request);
    if (principal) {
      request.principal = principal;
      return true;
    }
    if (this.hasMetadata(context, ALLOWS_ANONYMOUS_METADATA_KEY) && !this.sentApiKey(request)) {
      return true;
    }
    throw new UnauthorizedException();
  }

  private hasMetadata(context: ExecutionContext, key: string): boolean {
    return Boolean(
      this.reflector.getAllAndOverride<boolean>(key, [context.getHandler(), context.getClass()]),
    );
  }

  private sentApiKey(request: AuthenticatedRequest): boolean {
    return request.header(API_KEY_HEADER) !== undefined;
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
