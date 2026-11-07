import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { API_KEY_HEADER, AppConfigService } from '@crossmart/common';
import { bearerChallenge } from '@crossmart/core';
import { AUTHORIZATION_HEADER, WWW_AUTHENTICATE_HEADER } from '../auth.constants.js';

/**
 * Every 401 of the API names a challenge (RFC 9110 §15.5.2) that points to the Protected Resource
 * Metadata (RFC 9728), so an agent without a credential finds where to sign in, as on the MCP
 * server. It is the MCP server's metadata: the API accepts agent access tokens issued for that
 * resource (ADR 0019), so that is where an agent gets a token the API takes. The body is Nest's
 * usual one.
 */
@Catch(UnauthorizedException)
@Injectable()
export class BearerChallengeFilter implements ExceptionFilter<UnauthorizedException> {
  private readonly resourceUrl: string;

  constructor(appConfig: AppConfigService) {
    this.resourceUrl = appConfig.mcpPublicUrl;
  }

  catch(exception: UnauthorizedException, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    http
      .getResponse<Response>()
      .status(exception.getStatus())
      .set(WWW_AUTHENTICATE_HEADER, bearerChallenge(this.resourceUrl, this.sentCredential(request)))
      .json(exception.getResponse());
  }

  /** A credential that was sent and refused makes the challenge say `invalid_token`. */
  private sentCredential(request: Request): boolean {
    return (
      request.header(API_KEY_HEADER) !== undefined ||
      request.header(AUTHORIZATION_HEADER) !== undefined
    );
  }
}
