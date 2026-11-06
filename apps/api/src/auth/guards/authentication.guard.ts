import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_KEY_HEADER } from '@crossmart/common';
import { ApiKeysService } from '@crossmart/core';
import {
  ALLOWS_ANONYMOUS_METADATA_KEY,
  AUTHORIZATION_HEADER,
  BEARER_SCHEME,
  IS_PUBLIC_METADATA_KEY,
} from '../auth.constants.js';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { AuthenticatedRequest, Principal } from '../entities/principal.js';
import { AgentAuthenticator } from '../services/agent-authenticator.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Global guard: every route needs an API key, an agent's access token or a session cookie unless
 * it is `@Public()`. A route marked `@AllowAnonymous()` identifies callers who send credentials
 * and lets the others through anonymously; a wrong API key or access token is still refused.
 * On routes any website may call (public CORS, such as Ask), a session cookie counts only from a
 * trusted origin: from any other site the call is anonymous, even if the browser sent a cookie.
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly apiKeys: ApiKeysService,
    private readonly agents: AgentAuthenticator,
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
    if (this.hasMetadata(context, ALLOWS_ANONYMOUS_METADATA_KEY) && !this.sentCredential(request)) {
      return true;
    }
    throw new UnauthorizedException();
  }

  private hasMetadata(context: ExecutionContext, key: string): boolean {
    return Boolean(
      this.reflector.getAllAndOverride<boolean>(key, [context.getHandler(), context.getClass()]),
    );
  }

  /** An API key or bearer token that failed is refused, never treated as anonymous. */
  private sentCredential(request: AuthenticatedRequest): boolean {
    return request.header(API_KEY_HEADER) !== undefined || this.bearerToken(request) !== undefined;
  }

  /**
   * A presented API key or bearer token wins; an invalid one is rejected rather than falling back
   * to cookies.
   */
  private async resolvePrincipal(request: AuthenticatedRequest): Promise<Principal | null> {
    const apiKey = request.header(API_KEY_HEADER);
    if (apiKey !== undefined) {
      const identity = await this.apiKeys.authenticate(apiKey);
      return identity ? { kind: PrincipalKind.ApiKey, ...identity } : null;
    }
    const bearer = this.bearerToken(request);
    if (bearer !== undefined) {
      return this.agents.authenticate(bearer);
    }
    return this.authService.findUserBySessionFrom(request);
  }

  private bearerToken(request: AuthenticatedRequest): string | undefined {
    const [scheme, token] = request.header(AUTHORIZATION_HEADER)?.split(' ') ?? [];
    return scheme === BEARER_SCHEME && token ? token : undefined;
  }
}
